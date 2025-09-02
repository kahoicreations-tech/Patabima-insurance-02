from django.urls import path
from rest_framework import routers

from . import views

router = routers.DefaultRouter(trailing_slash=False)

router.register('auth',views.LoginViewSet,basename='auth')
router.register('user',views.UserViewset, basename='user')

urlpatterns = [
]

urlpatterns+=router.urls