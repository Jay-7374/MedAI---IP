import subprocess
import sys

def install_and_generate():
    # Install reportlab if not already installed
    try:
        import reportlab
    except ImportError:
        print("Installing reportlab...")
        subprocess.check_call([sys.executable, "-m", "pip", "install", "reportlab"])
    
    from reportlab.lib.pagesizes import letter
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib import colors

    pdf_path = "sample_medical_report.pdf"
    doc = SimpleDocTemplate(pdf_path, pagesize=letter,
                            rightMargin=72, leftMargin=72,
                            topMargin=72, bottomMargin=72)
    
    styles = getSampleStyleSheet()
    
    # Custom styles
    title_style = ParagraphStyle(
        'TitleStyle',
        parent=styles['Heading1'],
        fontSize=24,
        leading=28,
        textColor=colors.HexColor('#1A365D'),
        spaceAfter=20
    )
    
    body_style = ParagraphStyle(
        'BodyStyle',
        parent=styles['Normal'],
        fontSize=11,
        leading=16,
        textColor=colors.HexColor('#2D3748'),
        spaceAfter=12
    )
    
    meta_style = ParagraphStyle(
        'MetaStyle',
        parent=styles['Normal'],
        fontSize=10,
        leading=14,
        textColor=colors.HexColor('#718096'),
        spaceAfter=15
    )

    story = []
    
    story.append(Paragraph("MedAI Healthcare Assessment Report", title_style))
    story.append(Paragraph("Date: July 15, 2026 | Patient ID: PT-99482 | Status: Draft", meta_style))
    story.append(Spacer(1, 10))
    
    story.append(Paragraph("<b>1. Clinical Overview</b>", styles['Heading2']))
    story.append(Paragraph(
        "This is a sample medical assessment report generated automatically by MedAI. "
        "The patient presents with mild symptoms of fatigue and headaches. Preliminary diagnostics "
        "indicate normal blood pressure and heart rate.", body_style
    ))
    
    story.append(Paragraph("<b>2. Recommendations</b>", styles['Heading2']))
    story.append(Paragraph(
        "1. Ensure adequate hydration (at least 2.5 liters of water daily).<br/>"
        "2. Monitor sleep patterns and maintain a consistent sleep schedule.<br/>"
        "3. Follow-up consultation scheduled in two weeks for review of blood chemistry panels.", body_style
    ))
    
    story.append(Spacer(1, 40))
    story.append(Paragraph("<i>Note: This is an automatically generated sample document.</i>", meta_style))
    
    doc.build(story)
    print(f"Success: PDF generated at '{pdf_path}'")

if __name__ == "__main__":
    install_and_generate()
