from rest_framework.throttling import AnonRateThrottle, UserRateThrottle


class RegisterThrottle(AnonRateThrottle):
    scope = 'register'


class LoginThrottle(AnonRateThrottle):
    scope = 'login'


class CheckThrottle(UserRateThrottle):
    scope = 'check'
