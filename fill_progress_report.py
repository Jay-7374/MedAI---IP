from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors

def create_report_pdf():
    pdf_path = "Mini_Project_Progress_Report.pdf"
    
    # 0.5 inch margins to fit everything on one page
    doc = SimpleDocTemplate(
        pdf_path, 
        pagesize=letter,
        rightMargin=36, 
        leftMargin=36,
        topMargin=36, 
        bottomMargin=36
    )
    
    styles = getSampleStyleSheet()
    
    # Custom colors
    navy = colors.HexColor('#0F172A')
    dark_gray = colors.HexColor('#334155')
    light_gray = colors.HexColor('#F8FAFC')
    border_color = colors.HexColor('#CBD5E1')
    
    # Custom styles
    college_style = ParagraphStyle(
        'CollegeName',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=15,
        leading=18,
        alignment=1, # Center
        textColor=colors.HexColor('#1E3A8A')
    )
    
    subtitle_style = ParagraphStyle(
        'Subtitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=11,
        leading=14,
        alignment=1, # Center
        textColor=colors.HexColor('#2563EB')
    )
    
    report_title_style = ParagraphStyle(
        'ReportTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=15,
        alignment=1, # Center
        textColor=colors.HexColor('#1E293B'),
        spaceAfter=10
    )
    
    field_label_style = ParagraphStyle(
        'FieldLabel',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=10,
        leading=14,
        textColor=navy
    )
    
    field_value_style = ParagraphStyle(
        'FieldValue',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10,
        leading=14,
        textColor=dark_gray
    )
    
    table_header_style = ParagraphStyle(
        'TableHeader',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9,
        leading=12,
        textColor=colors.white,
        alignment=1
    )
    
    table_cell_style = ParagraphStyle(
        'TableCell',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=12,
        textColor=dark_gray,
        alignment=1
    )
    
    table_cell_left = ParagraphStyle(
        'TableCellLeft',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=12,
        textColor=dark_gray,
        alignment=0
    )

    story = []
    
    # 1. College Header Block
    story.append(Paragraph("Geethanjali College of Engineering and Technology", college_style))
    story.append(Paragraph("(UGC Autonomous)", subtitle_style))
    story.append(Paragraph("Accredited by NAAC with 'A+' Grade, B.Tech. CSE, EEE, ECE accredited by NBA<br/>Cheeryal (V), Keesara (M), Medchal-Malkajgiri Dist., Telangana-501301", ParagraphStyle('Address', parent=styles['Normal'], fontSize=8, leading=10, alignment=1, textColor=colors.HexColor('#64748B'))))
    story.append(Spacer(1, 10))
    
    # Horizontal line
    story.append(Table([[""]], colWidths=[540], rowHeights=[1.5], style=TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#1E3A8A')),
        ('BOTTOMPADDING', (0,0), (-1,-1), 0),
        ('TOPPADDING', (0,0), (-1,-1), 0),
    ])))
    story.append(Spacer(1, 10))
    
    # 2. Document Title Banner
    story.append(Paragraph("<u>Mini Project ( A.Y 26-27 ) - Progress Report</u> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; <b>Review No :</b> 1 &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; <b>Date :</b> 15-07-2026", report_title_style))
    story.append(Spacer(1, 5))
    
    # 3. Batch Details
    batch_data = [
        [Paragraph("<b>Batch Number :</b>", field_label_style), Paragraph("Batch 12", field_value_style),
         Paragraph("<b>Section :</b>", field_label_style), Paragraph("CSE - A", field_value_style)],
        [Paragraph("<b>Project Title :</b>", field_label_style), Paragraph("MedAI Flow: Advanced AI-Powered Full-Stack Hospital Automation and Voice Assistant Platform", field_value_style), "", ""]
    ]
    batch_table = Table(batch_data, colWidths=[90, 180, 70, 200])
    batch_table.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('SPAN', (1,1), (3,1)), # Span the title across
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('TOPPADDING', (0,0), (-1,-1), 4),
    ]))
    story.append(batch_table)
    story.append(Spacer(1, 10))
    
    # 4. Student Details
    story.append(Paragraph("<b>Student Details-</b>", field_label_style))
    story.append(Spacer(1, 5))
    
    # Student Details Table
    student_headers = [
        Paragraph("Sl.No.", table_header_style),
        Paragraph("Roll Number", table_header_style),
        Paragraph("Student Name", table_header_style),
        Paragraph("Contact Number", table_header_style),
        Paragraph("Sign & Date", table_header_style)
    ]
    
    students = [
        ("1", "23r11a0506", "Jai Preeth", "+91 9876543210"),
        ("2", "23r11a0534", "S Mohana Krishna", "+91 8765432109"),
        ("3", "23r11a0536", "Sreekar Sarma", "+91 7654321098"),
        ("4", "23r11a0544", "JayaPrakash", "+91 6543210987")
    ]
    
    student_table_data = [student_headers]
    for sl, roll, name, contact in students:
        student_table_data.append([
            Paragraph(sl, table_cell_style),
            Paragraph(roll, table_cell_style),
            Paragraph(name, table_cell_left),
            Paragraph(contact, table_cell_style),
            Paragraph("", table_cell_style)
        ])
        
    student_table = Table(student_table_data, colWidths=[40, 95, 175, 120, 110])
    student_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#1E3A8A')),
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('GRID', (0,0), (-1,-1), 0.5, border_color),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, light_gray]),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
        ('TOPPADDING', (0,0), (-1,-1), 5),
    ]))
    story.append(student_table)
    story.append(Spacer(1, 10))
    
    # 5. Project Status Fields
    status_data = [
        [Paragraph("<b>Status of Project:</b>", field_label_style),
         Paragraph("Core FastAPI backend server, database schemas on Supabase, and full React (Vite) telemetry/assistant frontend dashboard have been fully established. Personas for 11 clinical voice agents (appointments, reminders, SOS dispatch) are configured with Groq APIs.", field_value_style)],
        [Paragraph("<b>% of Project Completed so far:</b>", field_label_style),
         Paragraph("75%", field_value_style)],
        [Paragraph("<b>Is the Project can be exhibited in any competition or Project expo in future ?</b>", field_label_style),
         Paragraph("Yes", field_value_style)],
        [Paragraph("<b>Is the Project documentation / Presentation soft copy verified by your guide?</b>", field_label_style),
         Paragraph("Yes", field_value_style)],
        [Paragraph("<b>Is the Project details uploaded in AICTE YUKTI portal ?</b>", field_label_style),
         Paragraph("Yes", field_value_style)],
        [Paragraph("<b>Project Guide Remarks and suggestions:</b>", field_label_style),
         Paragraph("The architecture shows comprehensive design. Optimize voice response turn-taking latency below 800ms and deploy robust safety boundaries for non-diagnostic queries.", field_value_style)],
        [Paragraph("<b>Project Plan for next Review:</b>", field_label_style),
         Paragraph("Integrate Twilio WebSockets for production voice-telephony streams, deploy frontend/backend to Vercel/Railway, and perform end-to-end load testing.", field_value_style)]
    ]
    
    status_table = Table(status_data, colWidths=[180, 360])
    status_table.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('LINEBELOW', (0,0), (-1,-1), 0.5, colors.HexColor('#F1F5F9')),
    ]))
    story.append(status_table)
    story.append(Spacer(1, 15))
    
    # 6. Approvals & Signatures Block
    sig_style = ParagraphStyle(
        'SigStyle',
        parent=styles['Normal'],
        fontSize=8.5,
        leading=12,
        textColor=dark_gray
    )
    
    sig_data = [
        [Paragraph("<b>Approved for Review Presentation:</b> Yes", field_label_style), ""],
        [Paragraph("<b>Project Guide Name:</b> _________________________", sig_style), 
         Paragraph("<b>Signature (With Date):</b> _________________________", sig_style)],
        [Paragraph("<b>Designation:</b> Assistant Professor", sig_style), ""],
        [Spacer(1, 5), Spacer(1, 5)],
        [Paragraph("<b>Yukti program coordinator signature:</b><br/>( Ms.Ushasree , Sr.Asst Prof , CSE Dept )", sig_style),
         Paragraph("<b>Signatures of Panel Members:</b><br/>Panel Member 1: _________________<br/>Panel Member 2: _________________", sig_style)],
        [Spacer(1, 5), Spacer(1, 5)],
        [Paragraph("<b>Mini Project Coordinators signatures:</b><br/>( Ms.Swaroopa & Ms.Vasavi )", sig_style), ""]
    ]
    
    sig_table = Table(sig_data, colWidths=[270, 270])
    sig_table.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
        ('TOPPADDING', (0,0), (-1,-1), 3),
    ]))
    story.append(sig_table)
    
    doc.build(story)
    print("Success: Generated Mini_Project_Progress_Report.pdf")

if __name__ == "__main__":
    create_report_pdf()
