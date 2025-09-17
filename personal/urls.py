from django.urls import path
from . import views

urlpatterns = [
    path('', views.index, name='personal-index'),
    path('api/predict', views.predict, name='personal-predict'),
    path('api/risk_matrix', views.risk_matrix, name='personal-risk-matrix'),
]
