from django.urls import path
from . import views

urlpatterns = [
    path('signup/', views.signup, name='signup'),
    path('login/', views.login, name='login'),
    path('forgot-password/', views.forgot_password, name='forgot_password'),
    path('profile/', views.get_profile, name='get_profile'),
    path('progress/save/', views.save_progress, name='save_progress'),
    path('progress/load/', views.load_progress, name='load_progress'),
    # OTP-based password change
    path('change-password/send-otp/', views.send_change_password_otp, name='send_change_password_otp'),
    path('change-password/verify/', views.verify_otp_and_change_password, name='verify_otp_and_change_password'),
]