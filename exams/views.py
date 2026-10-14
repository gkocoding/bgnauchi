from datetime import timedelta
from django.utils import timezone
from django.db.models import Count, Prefetch, Q, F
from rest_framework import viewsets, generics, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import Subject, Exam, Question, StudentAttempt, QuestionResponse
from .serializers import (
    SubjectSerializer,
    ExamSerializer,
    ExamListSerializer,
    QuestionSerializer,
    StudentAttemptSerializer,
    RegisterSerializer,
    UserSerializer,
)
from .throttles import RegisterThrottle, CheckThrottle


class SubjectViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Subject.objects.all().order_by('id')
    serializer_class = SubjectSerializer
    permission_classes = [permissions.AllowAny]


class ExamViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Exam.objects.all()

    def get_queryset(self):
        queryset = Exam.objects.select_related('subject').order_by('id')

        if self.action == 'list':
            queryset = queryset.annotate(question_count=Count('questions'))
        else:
            queryset = queryset.prefetch_related(
                Prefetch('questions', queryset=Question.objects.order_by('id'))
            )

        grade = self.request.query_params.get('grade')
        subject = self.request.query_params.get('subject')
        if grade:
            queryset = queryset.filter(grade=grade) if grade.isdigit() else queryset.none()
        if subject:
            queryset = queryset.filter(subject__id=subject) if subject.isdigit() else queryset.none()
        return queryset

    def get_serializer_class(self):
        if self.action == 'list':
            return ExamListSerializer
        return ExamSerializer

    def get_permissions(self):
        if self.action == 'check':
            return [permissions.IsAuthenticated()]
        return [permissions.AllowAny()]

    @action(detail=True, methods=['post'], throttle_classes=[CheckThrottle])
    def check(self, request, pk=None):
        exam = self.get_object()
        answers = request.data.get('answers', {})
        duration_seconds = int(request.data.get('duration_seconds', 0) or 0)
        tab_switches = int(request.data.get('tab_switches', 0) or 0)

        if not isinstance(answers, dict):
            return Response(
                {'detail': "'answers' трябва да е обект {id_на_въпрос: буква}."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        questions = list(exam.questions.all())
        total = len(questions)
        score = 0
        earned_points = 0.0
        max_points = 0.0
        correct_answers = {}
        explanations = {}

        for question in questions:
            qid = str(question.id)
            correct_answers[qid] = question.correct_option
            if question.explanation:
                explanations[qid] = question.explanation

            q_points = float(question.points or 1.0)
            max_points += q_points

            submitted = answers.get(qid)
            if submitted == question.correct_option:
                score += 1
                earned_points += q_points

        attempt = StudentAttempt.objects.create(
            user=request.user,
            exam=exam,
            score=score,
            total_questions=total,
            earned_points=round(earned_points, 2),
            max_points=round(max_points, 2),
            duration_seconds=max(0, duration_seconds),
            tab_switches=max(0, tab_switches),
        )

        # Записваме индивидуалните отговори за "Поправи грешките си" и статистиката по теми
        responses_to_create = [
            QuestionResponse(
                attempt=attempt,
                question=q,
                selected_option=answers.get(str(q.id)),
                is_correct=(answers.get(str(q.id)) == q.correct_option),
            )
            for q in questions
        ]
        QuestionResponse.objects.bulk_create(responses_to_create)

        return Response({
            'score': score,
            'total': total,
            'earned_points': attempt.earned_points,
            'max_points': attempt.max_points,
            'mon_grade': attempt.mon_grade,
            'correct_answers': correct_answers,
            'explanations': explanations,
        })


class RegisterView(generics.CreateAPIView):
    queryset = None
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]
    throttle_classes = [RegisterThrottle]

    def get_queryset(self):
        from django.contrib.auth.models import User
        return User.objects.all()


class MeView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)


class MyAttemptsView(generics.ListAPIView):
    serializer_class = StudentAttemptSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return StudentAttempt.objects.filter(user=self.request.user).select_related('exam')


class ProfileAnalyticsView(APIView):
    """Връща статистика по теми (Skill Radar), дневен стрийк и брой сбъркани задачи."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        topic_stats = (
            QuestionResponse.objects
            .filter(attempt__user=user)
            .values(topic_name=F('question__topic'))
            .annotate(
                total=Count('id'),
                correct=Count('id', filter=Q(is_correct=True))
            )
        )

        skills = []
        for item in topic_stats:
            t_name = item['topic_name'] or "Общи задачи"
            total = item['total']
            acc = round((item['correct'] / total) * 100) if total > 0 else 0
            skills.append({
                'topic': t_name,
                'accuracy': acc,
                'total': total,
                'correct': item['correct'],
            })
        skills.sort(key=lambda x: x['accuracy'])

        # Изчисляване на дневен стрийк (последователни дни с решен тест)
        dates = list(
            StudentAttempt.objects
            .filter(user=user)
            .dates('completed_at', 'day', order='DESC')
        )
        streak = 0
        today = timezone.now().date()
        if dates:
            if dates[0] in [today, today - timedelta(days=1)]:
                streak = 1
                for i in range(len(dates) - 1):
                    if (dates[i] - dates[i + 1]).days == 1:
                        streak += 1
                    else:
                        break

        wrong_q_ids = (
            QuestionResponse.objects
            .filter(attempt__user=user, is_correct=False)
            .values_list('question_id', flat=True)
            .distinct()
            .count()
        )

        return Response({
            'skills': skills,
            'streak_days': streak,
            'mistakes_count': wrong_q_ids,
        })


class MistakeRepairExamView(APIView):
    """Генерира динамичен тест от сбърканите въпроси на потребителя и ги проверява."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        wrong_responses = (
            QuestionResponse.objects
            .filter(attempt__user=request.user, is_correct=False)
            .select_related('question')
            .order_by('-attempt__completed_at')
        )
        seen = set()
        questions = []
        for r in wrong_responses:
            if r.question_id not in seen:
                seen.add(r.question_id)
                questions.append(r.question)
            if len(questions) >= 15:
                break

        return Response({
            'id': 0,
            'title': 'Поправи грешките си — Тренировъчен режим',
            'grade': questions[0].exam.grade if questions else 12,
            'exam_type': 'nvo',
            'exam_label': 'Персонализиран преговор',
            'duration_minutes': max(15, len(questions) * 3),
            'questions': QuestionSerializer(questions, many=True).data,
        })

    def post(self, request):
        answers = request.data.get('answers', {})
        if not isinstance(answers, dict):
            return Response({'detail': 'Невалидни отговори.'}, status=status.HTTP_400_BAD_REQUEST)

        q_ids = [int(k) for k in answers.keys() if str(k).isdigit()]
        questions = list(Question.objects.filter(id__in=q_ids))
        total = len(questions)
        score = 0
        earned_points = 0.0
        max_points = 0.0
        correct_answers = {}
        explanations = {}

        for q in questions:
            qid = str(q.id)
            correct_answers[qid] = q.correct_option
            if q.explanation:
                explanations[qid] = q.explanation
            pts = float(q.points or 1.0)
            max_points += pts
            if answers.get(qid) == q.correct_option:
                score += 1
                earned_points += pts

        pct = (earned_points / max_points) * 100 if max_points > 0 else 0
        mon_grade = 2.00 if pct < 23 else min(6.00, round(2.0 + (pct / 100) * 4.0, 2))

        return Response({
            'score': score,
            'total': total,
            'earned_points': round(earned_points, 2),
            'max_points': round(max_points, 2),
            'mon_grade': mon_grade,
            'correct_answers': correct_answers,
            'explanations': explanations,
        })

import hashlib
from django.db.models import Sum
from .models import UserProfile, TeacherAssignment, AssignmentSubmission, DuelMatch


class LeaderboardView(APIView):
    """Класация Топ Ученици и Топ Училища + обновяване на училището в профила"""
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        # Топ 15 ученици по решени задачи и точки
        top_users = (
            StudentAttempt.objects
            .values(username=F('user__username'), school=F('user__profile__school_name'), city=F('user__profile__city'))
            .annotate(
                total_points=Sum('earned_points'),
                tests_count=Count('id')
            )
            .order_by('-total_points')[:15]
        )

        # Топ 10 училища
        top_schools = (
            StudentAttempt.objects
            .exclude(user__profile__school_name="")
            .exclude(user__profile__school_name__isnull=True)
            .values(school=F('user__profile__school_name'), city=F('user__profile__city'))
            .annotate(
                total_points=Sum('earned_points'),
                tests_count=Count('id')
            )
            .order_by('-total_points')[:10]
        )

        my_profile = None
        if request.user.is_authenticated:
            prof, _ = UserProfile.objects.get_or_create(user=request.user)
            my_profile = {
                'role': prof.role,
                'school_name': prof.school_name,
                'city': prof.city,
            }

        return Response({
            'students': list(top_users),
            'schools': list(top_schools),
            'my_profile': my_profile,
        })

    def post(self, request):
        if not request.user.is_authenticated:
            return Response({'detail': 'Нужен е вход.'}, status=status.HTTP_401_UNAUTHORIZED)
        prof, _ = UserProfile.objects.get_or_create(user=request.user)
        prof.school_name = str(request.data.get('school_name', '')).strip()[:150]
        prof.city = str(request.data.get('city', '')).strip()[:100]
        role = request.data.get('role')
        if role in ['student', 'teacher']:
            prof.role = role
        prof.save()
        return Response({'status': 'ok', 'school_name': prof.school_name, 'city': prof.city, 'role': prof.role})


class DailyChallengeView(APIView):
    """Задача на деня — избира детерминирано по 1 въпрос за всеки ден"""
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        q_count = Question.objects.count()
        if q_count == 0:
            return Response({'question': None})
        today_str = timezone.now().date().isoformat()
        idx = int(hashlib.md5(today_str.encode()).hexdigest(), 16) % q_count
        question = Question.objects.select_related('exam').all()[idx]
        return Response({
            'date': today_str,
            'grade': question.exam.grade,
            'question': QuestionSerializer(question).data,
        })

    def post(self, request):
        q_id = request.data.get('question_id')
        answer = request.data.get('answer')
        question = Question.objects.filter(id=q_id).first()
        if not question:
            return Response({'detail': 'Въпросът не е намерен.'}, status=status.HTTP_404_NOT_FOUND)
        return Response({
            'is_correct': answer == question.correct_option,
            'correct_option': question.correct_option,
            'explanation': question.explanation,
        })


class DuelView(APIView):
    """Създаване и играене на 1v1 Дуел с приятел (5 бързи задачи)"""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, code=None):
        if not code:
            return Response({'detail': 'Липсва код на дуел.'}, status=status.HTTP_400_BAD_REQUEST)
        duel = DuelMatch.objects.filter(code=code.upper()).first()
        if not duel:
            return Response({'detail': 'Дуелът не е намерен.'}, status=status.HTTP_404_NOT_FOUND)

        return Response({
            'code': duel.code,
            'grade': duel.grade,
            'creator': duel.creator.username,
            'creator_score': duel.creator_score,
            'creator_time': duel.creator_time,
            'opponent': duel.opponent.username if duel.opponent else None,
            'opponent_score': duel.opponent_score,
            'opponent_time': duel.opponent_time,
            'questions': QuestionSerializer(duel.questions.all(), many=True).data,
        })

    def post(self, request, code=None):
        # Ако няма код — създаваме нов дуел с 5 случайни въпроса за избрания клас
        if not code:
            grade = int(request.data.get('grade', 7))
            qs = list(Question.objects.filter(exam__grade=grade).order_by('?')[:5])
            if not qs:
                qs = list(Question.objects.order_by('?')[:5])
            duel = DuelMatch.objects.create(creator=request.user, grade=grade)
            duel.questions.set(qs)
            return Response({'code': duel.code})

        # Ако има код — записваме резултата на играча
        duel = DuelMatch.objects.filter(code=code.upper()).first()
        if not duel:
            return Response({'detail': 'Дуелът не е намерен.'}, status=status.HTTP_404_NOT_FOUND)

        answers = request.data.get('answers', {})
        duration = int(request.data.get('duration_seconds', 0) or 0)
        score = sum(1 for q in duel.questions.all() if answers.get(str(q.id)) == q.correct_option)

        if request.user == duel.creator and duel.creator_score is None:
            duel.creator_score = score
            duel.creator_time = duration
        elif request.user != duel.creator and duel.opponent_score is None:
            duel.opponent = request.user
            duel.opponent_score = score
            duel.opponent_time = duration
        duel.save()

        return Response({
            'score': score,
            'total': duel.questions.count(),
            'creator_score': duel.creator_score,
            'opponent_score': duel.opponent_score,
        })


class TeacherDashboardView(APIView):
    """B2B Модул за учители: създаване на домашни задания по теми и преглед на резултатите на класа"""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        assignments = TeacherAssignment.objects.filter(teacher=request.user).prefetch_related('submissions__student', 'questions')
        data = []
        for a in assignments:
            subs = [
                {
                    'student': s.student.username,
                    'score': s.score,
                    'total': s.total,
                    'pct': round((s.score / s.total) * 100) if s.total > 0 else 0,
                    'completed_at': s.completed_at,
                }
                for s in a.submissions.all()
            ]
            data.append({
                'id': a.id,
                'title': a.title,
                'code': a.code,
                'grade': a.grade,
                'question_count': a.questions.count(),
                'submissions': subs,
            })

        topics = list(Question.objects.values_list('topic', flat=True).distinct())
        return Response({'assignments': data, 'available_topics': [t for t in topics if t]})

    def post(self, request):
        title = str(request.data.get('title', 'Домашна работа')).strip()
        grade = int(request.data.get('grade', 7))
        topic = request.data.get('topic', '')
        count = min(40, max(1, int(request.data.get('count', 10))))

        qs = Question.objects.filter(exam__grade=grade)
        if topic:
            qs = qs.filter(topic=topic)
        selected_qs = list(qs.order_by('?')[:count])
        if not selected_qs:
            selected_qs = list(Question.objects.order_by('?')[:count])

        assignment = TeacherAssignment.objects.create(
            teacher=request.user,
            title=title,
            grade=grade,
        )
        assignment.questions.set(selected_qs)
        return Response({'code': assignment.code, 'title': assignment.title})

class HomeworkPlayView(APIView):
    """Позволява на ученик да отвори и предаде задание от учител чрез 6-цифрен код"""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, code):
        assignment = (
            TeacherAssignment.objects
            .filter(code=code.strip().upper())
            .prefetch_related('questions')
            .select_related('teacher')
            .first()
        )
        if not assignment:
            return Response(
                {'detail': 'Задание с такъв код не е намерено.'},
                status=status.HTTP_404_NOT_FOUND
            )

        existing = AssignmentSubmission.objects.filter(
            assignment=assignment,
            student=request.user
        ).first()

        return Response({
            'id': assignment.id,
            'title': assignment.title,
            'code': assignment.code,
            'grade': assignment.grade,
            'teacher': assignment.teacher.username,
            'already_submitted': existing is not None,
            'previous_score': existing.score if existing else None,
            'previous_total': existing.total if existing else None,
            'questions': QuestionSerializer(assignment.questions.all(), many=True).data,
        })

    def post(self, request, code):
        assignment = (
            TeacherAssignment.objects
            .filter(code=code.strip().upper())
            .prefetch_related('questions')
            .first()
        )
        if not assignment:
            return Response(
                {'detail': 'Заданието не е намерено.'},
                status=status.HTTP_404_NOT_FOUND
            )

        answers = request.data.get('answers', {})
        questions = list(assignment.questions.all())
        total = len(questions)
        score = 0
        correct_answers = {}
        explanations = {}

        for q in questions:
            qid = str(q.id)
            correct_answers[qid] = q.correct_option
            if q.explanation:
                explanations[qid] = q.explanation
            if answers.get(qid) == q.correct_option:
                score += 1

        # Записваме или обновяваме резултата в таблицата на учителя
        AssignmentSubmission.objects.update_or_create(
            assignment=assignment,
            student=request.user,
            defaults={'score': score, 'total': total}
        )

        pct = (score / total) * 100 if total > 0 else 0
        mon_grade = 2.00 if pct < 23 else min(6.00, round(2.0 + (pct / 100) * 4.0, 2))

        return Response({
            'score': score,
            'total': total,
            'pct': round(pct),
            'mon_grade': mon_grade,
            'correct_answers': correct_answers,
            'explanations': explanations,
        })