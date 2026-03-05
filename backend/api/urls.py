from django.urls import path
from . import views
from . import math_views
from .currency_views import get_currencies_by_ids, get_items_by_ids

urlpatterns = [
    # ── Auth ──────────────────────────────────────────────────────────────────
    path('signup/',                      views.signup,                         name='signup'),
    path('login/',                       views.login,                          name='login'),
    path('forgot-password/',             views.forgot_password,                name='forgot_password'),
    path('profile/',                     views.get_profile,                    name='get_profile'),

    # ── Progress ──────────────────────────────────────────────────────────────
    path('progress/save/',               views.save_progress,                  name='save_progress'),
    path('progress/load/',               views.load_progress,                  name='load_progress'),

    # ── Change Password ───────────────────────────────────────────────────────
    path('change-password/send-otp/',    views.send_change_password_otp,       name='send_change_password_otp'),
    path('change-password/verify/',      views.verify_otp_and_change_password, name='verify_otp_and_change_password'),

    # ── Currency Identification ───────────────────────────────────────────────
    path('identification/attempt/',      views.save_identification_attempt,    name='save_identification_attempt'),
    path('identification/stats/',        views.get_identification_stats,       name='get_identification_stats'),
    path('identification/history/',      views.get_identification_history,     name='get_identification_history'),

    # ── Math Game ─────────────────────────────────────────────────────────────
    # Fetch a random question by module + difficulty
    path('math/question/',               math_views.get_question,              name='get_question'),

    # Fetch a specific question by its ObjectId (for level revisit)
    path('math/question/by-id/',         math_views.get_question_by_id,        name='get_question_by_id'),

    # Save a completed question attempt + get stars & next difficulty
    path('math/attempt/save/',           math_views.save_level_attempt,        name='save_level_attempt'),

    # Get best-stars + question_id per level for a user+module
    path('math/level-stars/',            math_views.get_level_stars,           name='get_level_stars'),

    # Get the first question_id played at a specific level (for revisit)
    path('math/level-question/',         math_views.get_level_question,        name='get_level_question'),
    path("math/currencies/", views.get_currencies_by_ids),

    path("currencies/", get_currencies_by_ids, name="get_currencies_by_ids"),
    path("items/",      get_items_by_ids,      name="get_items_by_ids"),
]