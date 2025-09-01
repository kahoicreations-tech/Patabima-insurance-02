from django.urls import path
from rest_framework import routers

from . import views

router = routers.DefaultRouter(trailing_slash=False)

router.register('auth',views.LoginViewSet,basename='auth')

urlpatterns = [
]

urlpatterns+=router.urls