from django.contrib import admin
from django.http import HttpResponse
from django.utils.html import format_html
from .models import DocumentUpload, ServiceProcessingLog


@admin.register(DocumentUpload)
class DocumentUploadAdmin(admin.ModelAdmin):
    list_display = (
        'quotation', 'document_type', 'original_filename', 'processing_status',
        'confidence_display', 'file_size_display', 'upload_date'
    )
    list_filter = ('document_type', 'processing_status', 'date_created')
    search_fields = ('original_filename', 'document_type', 'quotation__quotation_number')
    readonly_fields = ('upload_date', 'confidence_display')

    fieldsets = (
        ('Document', {
            'fields': ('quotation', 'document_type', 'original_filename', 'file_path')
        }),
        ('Processing', {
            'fields': ('processing_status', 'extracted_data', 'extraction_confidence', 'upload_date')
        }),
    )

    actions = ['reprocess_documents', 'mark_processed', 'download_filenames']

    def upload_date(self, obj):
        return obj.date_created
    upload_date.short_description = 'Uploaded'

    def confidence_display(self, obj):
        if obj.extraction_confidence is None:
            return 'N/A'
        val = f"{obj.extraction_confidence:.0f}%"
        color = '#198754' if obj.extraction_confidence >= 80 else ('#ffc107' if obj.extraction_confidence >= 50 else '#dc3545')
        return format_html('<span style="color:{};">{}</span>', color, val)
    confidence_display.short_description = 'Confidence'

    def file_size_display(self, obj):
        # file_path is a string; size resolution would need storage backend; show placeholder
        return '—'
    file_size_display.short_description = 'Size'

    def reprocess_documents(self, request, queryset):
        # Placeholder: mark status to trigger background job
        updated = queryset.update(processing_status='REPROCESS')
        self.message_user(request, f"Queued {updated} documents for reprocessing")
    reprocess_documents.short_description = 'Reprocess selected'

    def mark_processed(self, request, queryset):
        updated = queryset.update(processing_status='PROCESSED')
        self.message_user(request, f"Marked {updated} as processed")
    mark_processed.short_description = 'Mark as processed'

    def download_filenames(self, request, queryset):
        response = HttpResponse(content_type='text/plain')
        response['Content-Disposition'] = 'attachment; filename="documents.txt"'
        for d in queryset:
            response.write(f"{d.original_filename}\n")
        return response
    download_filenames.short_description = 'Download filenames (.txt)'


@admin.register(ServiceProcessingLog)
class ServiceProcessingLogAdmin(admin.ModelAdmin):
    list_display = (
        'quotation', 'service_type', 'success_display', 'processing_time_display', 'date_created'
    )
    list_filter = ('service_type', 'success', 'date_created')
    search_fields = ('quotation__quotation_number', 'service_type')
    readonly_fields = ('response_preview', 'processing_time_display')

    fieldsets = (
        ('Service', {'fields': ('quotation', 'service_type', 'success', 'processing_time', 'processing_time_display')}),
        ('Request/Response', {'fields': ('request_data', 'response_data', 'response_preview')}),
    )

    def success_display(self, obj):
        return '✓' if obj.success else '✗'
    success_display.short_description = 'Status'

    def processing_time_display(self, obj):
        return f"{obj.processing_time} ms" if obj.processing_time is not None else '—'
    processing_time_display.short_description = 'Processing Time'

    def response_preview(self, obj):
        if not obj.response_data:
            return '—'
        text = str(obj.response_data)
        return (text[:200] + '…') if len(text) > 200 else text
    response_preview.short_description = 'Response Preview'
