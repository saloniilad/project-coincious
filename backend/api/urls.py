from django.urls import path
from . import views

urlpatterns = [
    path('signup/', views.signup, name='signup'),
    path('login/', views.login, name='login'),
    path('forgot-password/', views.forgot_password, name='forgot_password'),
    path('profile/', views.get_profile, name='get_profile'),
    path('progress/save/', views.save_progress, name='save_progress'),
    path('progress/load/', views.load_progress, name='load_progress'),
]