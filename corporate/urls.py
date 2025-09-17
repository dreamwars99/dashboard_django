from django.urls import path
from . import views

urlpatterns = [
    path('', views.index, name='corporate-index'),
    path('api/predict', views.predict, name='corporate-predict'),
    path('api/risk_matrix', views.risk_matrix, name='corporate-risk-matrix'),
]
