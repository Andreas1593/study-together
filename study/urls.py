from django.urls import path

from . import views

urlpatterns = [
    path('', views.index, name='index'),
    path('login', views.login_view, name='login'),
    path('logout', views.logout_view, name='logout'),
    path('register', views.register, name='register'),

    # API Routes
    path('user/<str:username>', views.user, name='user'),
    path('groups', views.groups, name='groups'),
    path('group/<str:groupName>', views.group, name='group'),
    path('subjects', views.subjects, name='subjects'),
    path('group/<str:groupName>/<str:subjectName>', views.cards, name='cards'),
    path('study/<str:groupName>/<str:subjectName>', views.study, name='study'),
    path('stats', views.stats, name='stats'),
    path('winrate/<str:groupName>/<str:subjectName>', views.winrateSubject, name='winrateSubject'),
]