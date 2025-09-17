from django.http import JsonResponse
from django.shortcuts import render
from django.views.decorators.csrf import ensure_csrf_cookie
from django.views.decorators.http import require_http_methods


@ensure_csrf_cookie
def index(request):
    panel = {
        'variant': 'corporate',
        'evidence': ['상위 SHAP 기여 요인 참조', '정책 준수 항목 확인 필요'],
        'policy_snippets': [
            '내부 규정 7조: DSCR 1.2 이상 유지',
            '감독 규정 18조: 부실 채권 비율 3% 이하',
        ],
        'checklist': [
            {'label': '재무제표', 'status': 'ok', 'status_label': '완료'},
            {'label': '사업보고서', 'status': 'warn', 'status_label': '보완'},
            {'label': '담보평가', 'status': 'missing', 'status_label': '미제출'},
        ],
        'audit': {
            'model': 'Corporate-Risk-v0.9',
            'what_if': '0건',
            'inputs': '0건',
        },
    }
    return render(request, 'corporate/index_cor.html', {'panel': panel, 'theme': 'corporate'})


@require_http_methods(['POST'])
def predict(request):
    return JsonResponse({'ok': True})


@require_http_methods(['POST'])
def risk_matrix(request):
    return JsonResponse({'ok': True})
