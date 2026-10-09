from django.contrib.auth.models import User
from django.core.cache import cache
from rest_framework.test import APITestCase

from .models import Subject, Exam, Question, StudentAttempt


class ExamApiTests(APITestCase):
    def setUp(self):
        cache.clear()  # throttling ползва кеша
        self.subject = Subject.objects.create(name="Математика")
        self.exam = Exam.objects.create(
            subject=self.subject, grade=12, title="Тест 1", exam_type="matura"
        )
        for i in range(3):
            Question.objects.create(
                exam=self.exam, text=f"Q{i}",
                option_a="1", option_b="2", option_c="3", option_d="4",
                correct_option="b",
            )
        self.user = User.objects.create_user("ivan", "ivan@example.com", "S0me-Str0ng-pass")

    # --- публичното API е само за четене ---
    def test_anonymous_cannot_modify_or_delete_exams(self):
        url = f"/api/exams/{self.exam.id}/"
        self.assertEqual(self.client.delete(url).status_code, 405)
        self.assertEqual(self.client.patch(url, {"title": "x"}, format="json").status_code, 405)
        self.assertEqual(self.client.post("/api/exams/", {"title": "x"}, format="json").status_code, 405)
        self.assertTrue(Exam.objects.filter(id=self.exam.id).exists())

    def test_even_logged_in_users_cannot_delete(self):
        self.client.force_authenticate(self.user)
        self.assertEqual(self.client.delete(f"/api/exams/{self.exam.id}/").status_code, 405)

    def test_subjects_are_read_only(self):
        self.assertEqual(self.client.get("/api/subjects/").status_code, 200)
        self.assertEqual(self.client.post("/api/subjects/", {"name": "x"}, format="json").status_code, 405)
        self.assertEqual(self.client.delete(f"/api/subjects/{self.subject.id}/").status_code, 405)

    # --- списъкът е лек, детайлът е пълен ---
    def test_list_has_question_count_and_no_questions(self):
        data = self.client.get("/api/exams/?grade=12").json()
        self.assertEqual(len(data), 1)
        self.assertEqual(data[0]["question_count"], 3)
        self.assertNotIn("questions", data[0])

    def test_detail_has_questions_without_answers(self):
        data = self.client.get(f"/api/exams/{self.exam.id}/").json()
        self.assertEqual(len(data["questions"]), 3)
        self.assertNotIn("correct_option", data["questions"][0])

    def test_bad_filter_params_do_not_crash(self):
        self.assertEqual(self.client.get("/api/exams/?grade=abc").json(), [])
        self.assertEqual(self.client.get("/api/exams/?subject=abc").json(), [])

    # --- проверка на отговори ---
    def test_check_requires_login(self):
        res = self.client.post(f"/api/exams/{self.exam.id}/check/", {"answers": {}}, format="json")
        self.assertEqual(res.status_code, 401)

    def test_check_scores_and_saves_attempt(self):
        self.client.force_authenticate(self.user)
        ids = list(self.exam.questions.values_list("id", flat=True))
        answers = {str(ids[0]): "b", str(ids[1]): "b", str(ids[2]): "a"}
        res = self.client.post(f"/api/exams/{self.exam.id}/check/", {"answers": answers}, format="json")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json()["score"], 2)
        self.assertEqual(res.json()["total"], 3)
        self.assertEqual(StudentAttempt.objects.filter(user=self.user).count(), 1)

    def test_check_rejects_malformed_answers(self):
        self.client.force_authenticate(self.user)
        res = self.client.post(f"/api/exams/{self.exam.id}/check/", {"answers": ["a", "b"]}, format="json")
        self.assertEqual(res.status_code, 400)
        self.assertEqual(StudentAttempt.objects.count(), 0)

    def test_check_is_rate_limited(self):
        self.client.force_authenticate(self.user)
        url = f"/api/exams/{self.exam.id}/check/"
        codes = [self.client.post(url, {"answers": {}}, format="json").status_code for _ in range(61)]
        self.assertEqual(codes[:60], [200] * 60)
        self.assertEqual(codes[60], 429)
