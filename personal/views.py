from django.http import JsonResponse
from django.shortcuts import render
from django.views.decorators.csrf import ensure_csrf_cookie
from django.views.decorators.http import require_http_methods


@ensure_csrf_cookie
def index(request):
    panel = {
        'variant': 'personal',
        'checklist': [
            {'label': '최근 급여명세서 수령', 'status': 'ok', 'status_label': '완료'},
            {'label': '소득 금액증명 제출', 'status': 'missing', 'status_label': '미제출'},
            {'label': '담보 감정가 최신화', 'status': 'warn', 'status_label': '보완'},
        ],
        'reports': [
            {'name': '김민수_심사보고서.pdf', 'meta': '2025-08-26 10:30'},
            {'name': '박서진_심사보고서.pdf', 'meta': '2025-08-26 09:15'},
        ],
        'audit': {
            'model': 'Qwen2.5-7B (리콜)',
            'version': 'v1.3.2',
            'threshold': '0.42',
            'updated_at': '2025-09-14T10:30',
        },
    }
    return render(request, 'personal/index.html', {'panel': panel, 'theme': 'personal'})


@require_http_methods(['POST'])
def predict(request):
    return JsonResponse({'ok': True})


@require_http_methods(['POST'])
def risk_matrix(request):
    return JsonResponse({'ok': True})
