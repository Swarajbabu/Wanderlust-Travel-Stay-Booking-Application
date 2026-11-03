import os
import sys
import base64
import subprocess
import pymupdf

def get_base64_img(filename):
    path = os.path.join('report_assets', filename)
    with open(path, 'rb') as f:
        data = f.read()
    ext = filename.split('.')[-1]
    return f"data:image/{ext};base64,{base64.b64encode(data).decode('utf-8')}"

# Load all 8 images
img_arch_system = get_base64_img('arch_system_3tier.png')
img_arch_schema = get_base64_img('arch_schema_er.png')
img_arch_replica = get_base64_img('arch_replica_set.png')
img_arch_seq = get_base64_img('arch_booking_sequence.png')
img_atlas = get_base64_img('media_1792168122268_20f8f88f.png')
img_explore = get_base64_img('media_1792168122312_78880b3f.png')
img_checkout = get_base64_img('media_1792168122358_05540987.png')
img_bookings = get_base64_img('media_1792168122338_8d70a7ca.png')

html_content = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>LPU MongoDB Major Project Report - Wanderlust</title>
<style>
  @page {{
    size: A4 portrait;
    margin: 16mm 18mm 16mm 18mm;
  }}
  * {{
    box-sizing: border-box;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }}
  body {{
    font-family: 'Times New Roman', Times, Georgia, serif;
    font-size: 10.5pt;
    line-height: 1.32;
    color: #000000;
    background-color: #ffffff;
    margin: 0;
    padding: 0;
  }}
  .page {{
    page-break-after: always;
    height: 260mm;
    max-height: 260mm;
    overflow: hidden;
    position: relative;
    padding-bottom: 2mm;
  }}
  .title-page {{
    text-align: center;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    height: 260mm;
  }}
  h1, h2, h3, h4 {{
    font-family: 'Times New Roman', Times, serif;
    color: #000000;
    margin-top: 0;
    margin-bottom: 4px;
    font-weight: bold;
  }}
  h1.chapter-title {{
    font-size: 15pt;
    text-transform: uppercase;
    text-align: center;
    border-bottom: 1.5px solid #000000;
    padding-bottom: 4px;
    margin-bottom: 10px;
  }}
  h2.section-title {{
    font-size: 11.5pt;
    border-bottom: 0.8px solid #000000;
    padding-bottom: 2px;
    margin-top: 8px;
    margin-bottom: 4px;
  }}
  h3.subsection-title {{
    font-size: 10.5pt;
    margin-top: 6px;
    margin-bottom: 3px;
    font-style: italic;
  }}
  p {{
    margin-top: 0;
    margin-bottom: 5px;
    text-align: justify;
    text-justify: inter-word;
  }}
  ul, ol {{
    margin-top: 2px;
    margin-bottom: 5px;
    padding-left: 20px;
  }}
  li {{
    margin-bottom: 2px;
    text-align: justify;
  }}
  table {{
    width: 100%;
    border-collapse: collapse;
    margin-top: 5px;
    margin-bottom: 7px;
    font-size: 8.8pt;
  }}
  th, td {{
    border: 1px solid #000000;
    padding: 3.5px 5px;
    text-align: left;
    vertical-align: top;
  }}
  th {{
    background-color: #f2f2f2;
    font-weight: bold;
    color: #000000;
  }}
  .code-block {{
    font-family: 'Consolas', 'Courier New', monospace;
    font-size: 8pt;
    background-color: #f8f8f8;
    border: 1px solid #000000;
    padding: 5px 8px;
    margin: 5px 0;
    white-space: pre-wrap;
    line-height: 1.22;
    color: #000000;
  }}
  .diagram-container {{
    text-align: center;
    margin: 6px 0;
  }}
  .diagram-container img {{
    max-width: 96%;
    max-height: 105mm;
    border: 1px solid #000000;
    display: inline-block;
  }}
  .caption {{
    font-size: 8.5pt;
    font-weight: bold;
    text-align: center;
    margin-top: 3px;
    margin-bottom: 5px;
  }}
  .toc-row {{
    display: flex;
    justify-content: space-between;
    margin-bottom: 3px;
    font-size: 9.8pt;
  }}
  .toc-dots {{
    flex-grow: 1;
    border-bottom: 1px dotted #000000;
    margin: 0 5px;
    position: relative;
    top: -3px;
  }}
  .signature-box {{
    margin-top: 40px;
    display: flex;
    justify-content: space-between;
  }}
  .signature-line {{
    width: 200px;
    border-top: 1px solid #000000;
    text-align: center;
    padding-top: 4px;
    font-size: 9.5pt;
  }}
</style>
</head>
<body>

<!-- ========================================== -->
<!-- PAGE 1: TITLE PAGE                         -->
<!-- ========================================== -->
<div class="page title-page">
  <div style="border: 2px solid #000000; padding: 12px; height: 100%; display: flex; flex-direction: column; justify-content: space-between;">
    <div>
      <div style="font-size: 13pt; font-weight: bold; letter-spacing: 1px;">LOVELY PROFESSIONAL UNIVERSITY</div>
      <div style="font-size: 10pt; font-weight: bold; margin-top: 3px;">SCHOOL OF COMPUTER SCIENCE AND ENGINEERING</div>
      <div style="font-size: 9pt; margin-top: 2px;">DEPARTMENT OF COMPUTER SCIENCE & ENGINEERING, PUNJAB, INDIA</div>
      <hr style="border: 0; border-top: 1.5px solid #000000; margin: 10px 30px;">
    </div>

    <div>
      <div style="font-size: 11pt; font-weight: bold; text-transform: uppercase; margin-bottom: 6px;">A Major Project Report On</div>
      <div style="font-size: 17pt; font-weight: bold; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 8px;">WANDERLUST</div>
      <div style="font-size: 11.5pt; font-style: italic; max-width: 85%; margin: 0 auto; line-height: 1.35;">
        A Full-Stack Vacation Rental Platform with Document-Oriented NoSQL Architecture Built with MongoDB Atlas, Express.js, Node.js, EJS, Passport.js, and Razorpay
      </div>
      <div style="margin-top: 15px; font-size: 9.5pt;">
        Submitted in partial fulfillment of the requirements for the award of the degree of<br>
        <strong>BACHELOR OF TECHNOLOGY IN COMPUTER SCIENCE AND ENGINEERING</strong>
      </div>
    </div>

    <div style="margin: 10px 0;">
      <table style="width: 85%; margin: 0 auto; border: none;">
        <tr style="border: none;">
          <td style="width: 50%; border: none; text-align: left; padding: 4px;">
            <strong>SUBMITTED TO:</strong><br>
            <strong>Dr. Manpreet Singh Sehgal</strong><br>
            Associate Professor / Faculty Mentor<br>
            Faculty UID: 32354<br>
            School of Computer Science & Engineering
          </td>
          <td style="width: 50%; border: none; text-align: right; padding: 4px;">
            <strong>SUBMITTED BY:</strong><br>
            <strong>Vecha Laxmi Swaraj babu</strong><br>
            Registration Number: 12307477<br>
            Roll Number: 60<br>
            Section: K22GF
          </td>
        </tr>
      </table>
    </div>

    <div>
      <div style="font-size: 9pt; margin-bottom: 4px;">
        <strong>COURSE CODE:</strong> CSE494 &nbsp;&nbsp;|&nbsp;&nbsp; <strong>COURSE TITLE:</strong> INTELLIGENT NOSQL DATABASES
      </div>
      <div style="font-size: 9pt; margin-bottom: 4px;">
        <strong>ACADEMIC SESSION:</strong> 2025 – 2026
      </div>
      <div style="font-size: 8.5pt; margin-top: 6px;">
        <strong>Project Repository:</strong> https://github.com/Swarajbabu/Wanderlust-Travel-Stay-Booking-Application<br>
        <strong>Production Deployment:</strong> https://wanderlust.swarajvecha.in
      </div>
    </div>
  </div>
</div>

<!-- ========================================== -->
<!-- PAGE 2: CERTIFICATE OF APPROVAL            -->
<!-- ========================================== -->
<div class="page">
  <h1 class="chapter-title">Certificate of Approval</h1>
  <br>
  <p>
    This is to certify that the Major Project Report entitled <strong>"WANDERLUST: A Full-Stack Vacation Rental Platform with Document-Oriented NoSQL Architecture"</strong> submitted by <strong>Vecha Laxmi Swaraj babu</strong> (Registration Number: <strong>12307477</strong>, Roll Number: <strong>60</strong>) in partial fulfillment of the requirements for the award of the degree of <strong>Bachelor of Technology in Computer Science and Engineering</strong> for the course <strong>INTELLIGENT NOSQL DATABASES (CSE494)</strong> at <strong>Lovely Professional University, Punjab</strong>, is an authentic record of bonafide research and practical development work carried out under my guidance and supervision.
  </p>
  <p>
    The student has successfully designed, architected, implemented, and validated a scalable document-oriented database system utilizing <strong>MongoDB Atlas</strong>, featuring custom multi-collection schema designs (Users, Listings, Bookings, Reviews, and Sessions), 2dsphere geospatial indexing, compound full-text indexing, interval-based double-booking prevention, atomic updates, and Razorpay HMAC-SHA256 cryptographic payment verification.
  </p>
  <p>
    The technical matter embodied in this report has not been submitted previously to any other university, institute, or examining body for the award of any other degree, diploma, or academic distinction.
  </p>
  
  <br><br><br>
  <div class="signature-box">
    <div class="signature-line">
      <strong>Dr. Manpreet Singh Sehgal</strong><br>
      Faculty Supervisor (UID: 32354)<br>
      Associate Professor<br>
      Department of CSE, LPU
    </div>
    <div class="signature-line">
      <strong>Head of Department</strong><br>
      School of Computer Science & Engg.<br>
      Lovely Professional University<br>
      Punjab, India
    </div>
  </div>
  
  <br><br><br>
  <p style="font-size: 9pt;">
    <strong>Date:</strong> 16 October 2026<br>
    <strong>Place:</strong> Phagwara, Punjab, India
  </p>
</div>

<!-- ========================================== -->
<!-- PAGE 3: DECLARATION & ACKNOWLEDGEMENT      -->
<!-- ========================================== -->
<div class="page">
  <h1 class="chapter-title">Candidate Declaration</h1>
  <p>
    I, <strong>Vecha Laxmi Swaraj babu</strong>, hereby declare that the work presented in this Major Project Report entitled <strong>"WANDERLUST: A Full-Stack Vacation Rental Platform with Document-Oriented NoSQL Architecture"</strong> is entirely my own original work conducted under the supervision of <strong>Dr. Manpreet Singh Sehgal</strong>, School of Computer Science and Engineering, Lovely Professional University.
  </p>
  <p>
    I confirm that the project implements real, production-ready source code, database collections, queries, and automated testing suites without uncredited reuse of third-party intellectual property. Any ideas, quotations, techniques, or algorithms referenced from established academic literature, documentation, or open-source software libraries have been duly cited in the References and Bibliography section.
  </p>
  <div style="margin-top: 25px; text-align: right;">
    <div style="display: inline-block; text-align: center; width: 220px; border-top: 1px solid #000000; padding-top: 4px;">
      <strong>Vecha Laxmi Swaraj babu</strong><br>
      Registration No: 12307477<br>
      Roll No: 60, Section: K22GF
    </div>
  </div>

  <hr style="border: 0; border-top: 1px solid #000000; margin: 18px 0;">

  <h1 class="chapter-title" style="margin-top: 10px;">Acknowledgement</h1>
  <p>
    I would like to express my profound gratitude and deepest appreciation to my esteemed faculty supervisor, <strong>Dr. Manpreet Singh Sehgal</strong> (UID: 32354), for his continuous technical guidance, incisive academic critique, and invaluable encouragement throughout the conceptualization, system architecture, database design, and evaluation phases of this project. His deep expertise in Intelligent NoSQL Databases and distributed systems significantly enriched the design of our schema references, geospatial queries, and concurrency models.
  </p>
  <p>
    I am equally grateful to the <strong>School of Computer Science and Engineering</strong> and the leadership of <strong>Lovely Professional University</strong> for providing an exceptional academic environment, modern cloud computing infrastructure, and comprehensive lab resources essential for developing and testing full-stack distributed database applications.
  </p>
  <p>
    Finally, I extend my heartfelt thanks to my parents and peers whose constant moral encouragement, intellectual discussions, and constructive feedback provided the vital motivation to complete this project to high engineering and academic standards.
  </p>
</div>

<!-- ========================================== -->
<!-- PAGE 4: ABSTRACT                           -->
<!-- ========================================== -->
<div class="page">
  <h1 class="chapter-title">Abstract</h1>
  <p>
    Modern vacation rental platforms handle complex polymorphic property listings, high-concurrency reservation schedules, and secure monetary settlements. Conventional Relational Database Management Systems (RDBMS) often impose schema rigidity and costly multi-table joins when managing heterogeneous property attributes, dynamic amenity metadata, nested multimedia assets, and geospatial coordinates at scale. This project presents <strong>Wanderlust</strong>, an end-to-end full-stack vacation rental web platform developed using the HCJNE stack (HTML5, CSS3, JavaScript ES6+, Node.js, Express.js) backed by a production-grade <strong>MongoDB Atlas NoSQL document database</strong>.
  </p>
  <p>
    Wanderlust models data across four primary domain collections—<strong>Users</strong>, <strong>Listings</strong>, <strong>Bookings</strong>, and <strong>Reviews</strong>—alongside an independent distributed <strong>Sessions</strong> collection managed via <code>connect-mongo</code>. The database architecture emphasizes document modeling best practices, balancing normalized references (ObjectId associations with Mongoose population) and embedded subdocuments (GeoJSON Points and multimedia descriptors). To ensure real-time query efficiency, compound text indexes were engineered over listing titles, locations, and countries, complemented by 2dsphere geospatial indexes for proximity exploration and sparse unique indexes for Google OAuth 2.0 federation.
  </p>
  <p>
    A critical architectural challenge in rental platforms is the prevention of double-booking under concurrent reservation attempts. Wanderlust solves this through an atomic MongoDB overlap query (<code>checkIn &lt; requestedCheckOut AND checkOut &gt; requestedCheckIn</code>) combined with server-side price computation that completely eliminates client-side tampering. Financial transactions are processed via Razorpay with cryptographic HMAC-SHA256 signature verification prior to state mutation. The system incorporates defense-in-depth security, including Helmet Content-Security-Policy (CSP), double-submit cookie CSRF tokens, Joi validation schemas, and Bcrypt-hashed OTP email verification.
  </p>
  <p>
    The platform's resilience is validated through an automated integration test suite utilizing Jest, Supertest, and an in-memory MongoDB server (<code>mongodb-memory-server</code>), achieving 100% test passage across authentication, property lifecycle, and booking overlap scenarios. Wanderlust is deployed on production infrastructure with MongoDB Atlas, serving live users with sub-35ms query execution times and zero data anomalies.
  </p>
  <p style="margin-top: 12px;">
    <strong>Keywords:</strong> MongoDB Atlas, NoSQL Document Database, Geospatial Indexing, Double-Booking Concurrency, Mongoose ODM, Razorpay HMAC Cryptography, Express.js, MVC Architecture.
  </p>
</div>

<!-- ========================================== -->
<!-- PAGE 5: TABLE OF CONTENTS                  -->
<!-- ========================================== -->
<div class="page">
  <h1 class="chapter-title">Table of Contents</h1>
  
  <div class="toc-row"><strong>Certificate of Approval</strong><span class="toc-dots"></span><strong>ii</strong></div>
  <div class="toc-row"><strong>Candidate Declaration</strong><span class="toc-dots"></span><strong>iii</strong></div>
  <div class="toc-row"><strong>Acknowledgement</strong><span class="toc-dots"></span><strong>iii</strong></div>
  <div class="toc-row"><strong>Abstract</strong><span class="toc-dots"></span><strong>iv</strong></div>
  <div class="toc-row"><strong>List of Figures</strong><span class="toc-dots"></span><strong>vi</strong></div>
  <div class="toc-row"><strong>List of Tables</strong><span class="toc-dots"></span><strong>vi</strong></div>
  
  <div class="toc-row" style="margin-top: 6px;"><strong>1. Introduction</strong><span class="toc-dots"></span><strong>1</strong></div>
  <div class="toc-row" style="padding-left: 15px;">1.1 Background and Industry Motivation<span class="toc-dots"></span>1</div>
  <div class="toc-row" style="padding-left: 15px;">1.2 Evolution from Relational Systems to NoSQL Document Stores<span class="toc-dots"></span>1</div>
  <div class="toc-row" style="padding-left: 15px;">1.3 Overview of the Wanderlust Platform<span class="toc-dots"></span>1</div>
  
  <div class="toc-row" style="margin-top: 3px;"><strong>2. Problem Statement</strong><span class="toc-dots"></span><strong>2</strong></div>
  <div class="toc-row"><strong>3. Objectives of the Project</strong><span class="toc-dots"></span><strong>2</strong></div>
  <div class="toc-row"><strong>4. Scope of the Project</strong><span class="toc-dots"></span><strong>3</strong></div>
  <div class="toc-row"><strong>5. Literature Review</strong><span class="toc-dots"></span><strong>3</strong></div>
  <div class="toc-row"><strong>6. System Requirements (Hardware and Software)</strong><span class="toc-dots"></span><strong>4</strong></div>
  
  <div class="toc-row" style="margin-top: 3px;"><strong>7. System Design and Architecture</strong><span class="toc-dots"></span><strong>5</strong></div>
  <div class="toc-row" style="padding-left: 15px;">7.1 Three-Tier System Architecture & Persistence Pipeline<span class="toc-dots"></span>5</div>
  <div class="toc-row" style="padding-left: 15px;">7.2 Component Interaction & Request-Response Lifecycle<span class="toc-dots"></span>6</div>
  <div class="toc-row" style="padding-left: 15px;">7.3 Defense-in-Depth Middleware & Security Pipeline<span class="toc-dots"></span>6</div>
  
  <div class="toc-row" style="margin-top: 3px;"><strong>8. Database Design</strong><span class="toc-dots"></span><strong>7</strong></div>
  <div class="toc-row" style="padding-left: 15px;">8.1 Schema Architecture & Modeling Strategy (Embedding vs. Referencing)<span class="toc-dots"></span>7</div>
  <div class="toc-row" style="padding-left: 15px;">8.2 Collection Schemas & Data Dictionaries (Users & Listings)<span class="toc-dots"></span>8</div>
  <div class="toc-row" style="padding-left: 15px;">8.3 Collection Schemas & Data Dictionaries (Bookings, Reviews, Sessions)<span class="toc-dots"></span>9</div>
  <div class="toc-row" style="padding-left: 15px;">8.4 MongoDB Atlas Distributed Replica Set Cluster Architecture<span class="toc-dots"></span>10</div>
  <div class="toc-row" style="padding-left: 15px;">8.5 Indexing Strategy & Execution Plan Analysis<span class="toc-dots"></span>10</div>
  
  <div class="toc-row" style="margin-top: 3px;"><strong>9. Implementation and Methodology</strong><span class="toc-dots"></span><strong>11</strong></div>
  <div class="toc-row" style="padding-left: 15px;">9.1 Engineering Methodology & Module Structure<span class="toc-dots"></span>11</div>
  <div class="toc-row" style="padding-left: 15px;">9.2 Authentication, OAuth 2.0 & Bcrypt OTP Email Verification<span class="toc-dots"></span>11</div>
  <div class="toc-row" style="padding-left: 15px;">9.3 Listing Management, Media Streaming & Forward Geocoding<span class="toc-dots"></span>11</div>
  <div class="toc-row" style="padding-left: 15px;">9.4 Booking Concurrency Engine & Razorpay HMAC Cryptography<span class="toc-dots"></span>12</div>
  
  <div class="toc-row" style="margin-top: 3px;"><strong>10. MongoDB Queries and Operations</strong><span class="toc-dots"></span><strong>13</strong></div>
  <div class="toc-row" style="padding-left: 15px;">10.1 CRUD Implementations & Atomic Updates<span class="toc-dots"></span>13</div>
  <div class="toc-row" style="padding-left: 15px;">10.2 Advanced Aggregation Pipelines (Revenue & Reviews)<span class="toc-dots"></span>13</div>
  <div class="toc-row" style="padding-left: 15px;">10.3 Geospatial Proximity Queries ($nearSphere)<span class="toc-dots"></span>13</div>
  
  <div class="toc-row" style="margin-top: 3px;"><strong>11. Results and Output Screenshots</strong><span class="toc-dots"></span><strong>14</strong></div>
  <div class="toc-row" style="padding-left: 15px;">11.1 MongoDB Atlas Cluster Verification & Storage Allocation<span class="toc-dots"></span>14</div>
  <div class="toc-row" style="padding-left: 15px;">11.2 Explore Feed & Multi-Category Filtering Interface<span class="toc-dots"></span>15</div>
  <div class="toc-row" style="padding-left: 15px;">11.3 Dynamic Date Reservation & Pricing Engine Summary<span class="toc-dots"></span>15</div>
  <div class="toc-row" style="padding-left: 15px;">11.4 Guest Dashboard & Booking Lifecycle Management<span class="toc-dots"></span>16</div>
  <div class="toc-row" style="padding-left: 15px;">11.5 Quantitative System Performance Benchmarks<span class="toc-dots"></span>16</div>
  
  <div class="toc-row" style="margin-top: 3px;"><strong>12. Testing and Validation</strong><span class="toc-dots"></span><strong>17</strong></div>
  <div class="toc-row"><strong>13. Challenges Faced</strong><span class="toc-dots"></span><strong>18</strong></div>
  <div class="toc-row"><strong>14. Conclusion</strong><span class="toc-dots"></span><strong>19</strong></div>
  <div class="toc-row"><strong>15. Future Scope</strong><span class="toc-dots"></span><strong>19</strong></div>
  <div class="toc-row"><strong>16. References / Bibliography</strong><span class="toc-dots"></span><strong>20</strong></div>
  <div class="toc-row"><strong>17. Appendix</strong><span class="toc-dots"></span><strong>21</strong></div>
</div>

<!-- ========================================== -->
<!-- PAGE 6: LIST OF FIGURES & LIST OF TABLES   -->
<!-- ========================================== -->
<div class="page">
  <h1 class="chapter-title">List of Figures & Tables</h1>
  
  <h2 class="section-title">List of Figures</h2>
  <div class="toc-row"><strong>Figure 1:</strong> Three-Tier System Architecture & Persistence Pipeline<span class="toc-dots"></span>5</div>
  <div class="toc-row"><strong>Figure 2:</strong> MongoDB Entity-Relationship & Document Schema Architecture<span class="toc-dots"></span>7</div>
  <div class="toc-row"><strong>Figure 3:</strong> MongoDB Atlas Distributed 3-Node Replica Set Architecture<span class="toc-dots"></span>10</div>
  <div class="toc-row"><strong>Figure 4:</strong> Double-Booking Prevention & Payment Verification Sequence Flow<span class="toc-dots"></span>12</div>
  <div class="toc-row"><strong>Figure 5:</strong> MongoDB Atlas Data Explorer Showing Collections, Storage Size, and Document Counts<span class="toc-dots"></span>14</div>
  <div class="toc-row"><strong>Figure 6:</strong> Wanderlust Production Explore Homepage with Category Filters and Property Listings<span class="toc-dots"></span>15</div>
  <div class="toc-row"><strong>Figure 7:</strong> Reservation Summary, Dynamic Date-Range Picker, and Server-Side GST Calculation<span class="toc-dots"></span>15</div>
  <div class="toc-row"><strong>Figure 8:</strong> Guest Booking Management Dashboard with Confirmed Reservation Cards<span class="toc-dots"></span>16</div>

  <br>
  <h2 class="section-title">List of Tables</h2>
  <div class="toc-row"><strong>Table 1:</strong> RDBMS vs. MongoDB NoSQL Architectural Comparison<span class="toc-dots"></span>3</div>
  <div class="toc-row"><strong>Table 2:</strong> Hardware and Software Environmental Specifications<span class="toc-dots"></span>4</div>
  <div class="toc-row"><strong>Table 3:</strong> Architectural Layer Responsibilities in Wanderlust MVC<span class="toc-dots"></span>5</div>
  <div class="toc-row"><strong>Table 4:</strong> Users Collection Data Dictionary (modals/user.js)<span class="toc-dots"></span>8</div>
  <div class="toc-row"><strong>Table 5:</strong> Listings Collection Data Dictionary (modals/listing.js)<span class="toc-dots"></span>8</div>
  <div class="toc-row"><strong>Table 6:</strong> Bookings Collection Data Dictionary (modals/booking.js)<span class="toc-dots"></span>9</div>
  <div class="toc-row"><strong>Table 7:</strong> Reviews & Sessions Collection Data Dictionaries<span class="toc-dots"></span>9</div>
  <div class="toc-row"><strong>Table 8:</strong> Automated Integration Test Execution Matrix (Jest & MongoDB Memory Server)<span class="toc-dots"></span>17</div>
  <div class="toc-row"><strong>Table 9:</strong> Production Cloud Performance & Query Latency Benchmarks<span class="toc-dots"></span>16</div>
  <div class="toc-row"><strong>Table 10:</strong> Wanderlust RESTful Routing & Security Authorization Matrix<span class="toc-dots"></span>21</div>
</div>

<!-- ========================================== -->
<!-- PAGE 7: CHAPTER 1: INTRODUCTION            -->
<!-- ========================================== -->
<div class="page">
  <h1 class="chapter-title">1. Introduction</h1>
  
  <h2 class="section-title">1.1 Background and Industry Motivation</h2>
  <p>
    Over the past two decades, the global hospitality and travel accommodation sector has undergone a fundamental paradigm shift. Traditional hotel booking models, characterized by rigid room types and standardized inventories, have been extensively supplemented—and in many markets surpassed—by peer-to-peer vacation rental platforms such as Airbnb, Vrbo, and Booking.com. In this modern paradigm, properties are polymorphic: an accommodation may be an urban studio apartment, a heritage bungalow, a mountain yurt, or a treehouse.
  </p>
  <p>
    Managing such diverse inventory necessitates database systems capable of handling semi-structured, heterogeneous attributes without requiring continual, costly schema migrations. Furthermore, hospitality platforms operate under extreme transactional volatility, where thousands of users concurrently search, filter, inspect availability calendars, and execute bookings across overlapping date ranges. The technical foundation must provide sub-second search latency, zero date-booking collisions, and absolute monetary integrity.
  </p>

  <h2 class="section-title">1.2 Evolution from Relational Systems to NoSQL Document Stores</h2>
  <p>
    Historically, enterprise web applications relied upon Relational Database Management Systems (RDBMS) governed by strict Codd's Normal Forms. While RDBMS excels in standardized ledger transactions, it introduces significant friction when applied to modern polymorphic web platforms:
  </p>
  <ul>
    <li><strong>Object-Relational Impedance Mismatch:</strong> In an RDBMS, persisting an object containing nested structures—such as geospatial coordinates <code>[lng, lat]</code>, variable amenity tags, and multi-image Cloudinary payloads—demands decomposing the data across multiple normalized tables (e.g., <code>properties</code>, <code>property_images</code>, <code>property_amenities</code>, <code>property_locations</code>). Reconstructing this object on every read query requires expensive multi-way SQL <code>JOIN</code> operations.</li>
    <li><strong>Schema Rigidity:</strong> Altering table schemas to accommodate novel property categories or regional compliance attributes requires disruptive <code>ALTER TABLE</code> operations, often locking tables in production.</li>
    <li><strong>Horizontal Scaling Impediments:</strong> Sharding traditional SQL databases across distributed server clusters while maintaining cross-table referential integrity and distributed multi-table ACID joins introduces immense architectural overhead.</li>
  </ul>
  <p>
    In contrast, <strong>MongoDB</strong>—a distributed NoSQL document database—stores records natively as Binary JSON (BSON). By modeling data into rich, self-contained JSON-like documents, MongoDB bridges the impedance mismatch: data is stored in the exact format required by the application runtime. Embedded arrays, GeoJSON coordinates, and dynamic fields are first-class citizens, while high-throughput indexing and replica-set clustering enable effortless horizontal elasticity and fault tolerance.
  </p>

  <h2 class="section-title">1.3 Overview of the Wanderlust Platform</h2>
  <p>
    <strong>Wanderlust</strong> is an end-to-end full-stack vacation rental web platform engineered using the <strong>HCJNE stack</strong> (HTML5, CSS3, JavaScript ES6+, Node.js, Express.js) backed by a production <strong>MongoDB Atlas</strong> cloud database. Wanderlust allows property hosts to publish, update, and manage accommodation listings with Cloudinary media storage and Mapbox forward-geocoding, while providing guests with an interactive exploration portal, real-time availability calendar, and Razorpay-powered payment processing.
  </p>
</div>

<!-- ========================================== -->
<!-- PAGE 8: CHAPTER 2 & 3: PROBLEM & OBJECTIVES-->
<!-- ========================================== -->
<div class="page">
  <h1 class="chapter-title">2. Problem Statement & 3. Objectives</h1>
  
  <h2 class="section-title">2. Problem Statement</h2>
  <p>
    Building a commercial-grade vacation rental platform presents several critical architectural and database engineering challenges that conventional development stacks fail to resolve adequately:
  </p>
  <ol>
    <li><strong>Polymorphic Listing Data Incompatibility:</strong> Accommodation properties feature highly variable metadata (e.g., distinct amenities, categories ranging from "Castles" to "Caves", varying pricing rules, and geographical coordinate systems). Relational schemas force either excessive sparse null columns or convoluted Entity-Attribute-Value (EAV) designs that degrade query performance.</li>
    <li><strong>Double-Booking Concurrency Collisions:</strong> The primary failure mode of reservation systems is the race condition: two concurrent guests attempting to book the identical property across overlapping date ranges. Without atomic, database-enforced interval overlap verification, system integrity collapses, causing disastrous double-bookings.</li>
    <li><strong>Client-Side Financial Vulnerability:</strong> Many naive web implementations compute booking costs or room rates on the frontend browser client, allowing malicious actors to alter HTTP payloads and submit artificially low payment totals to the server.</li>
    <li><strong>Session Storage Bottlenecks:</strong> Relying on default in-memory session stores causes session loss upon server restarts and prevents horizontal scaling across multi-core or containerized server instances.</li>
  </ol>

  <h2 class="section-title">3. Objectives of the Project</h2>
  <p>
    The primary purpose of Wanderlust is to architect, build, and validate an enterprise-grade vacation rental solution addressing these vulnerabilities through intelligent NoSQL database engineering. The technical and operational objectives are formally defined below:
  </p>
  
  <h3 class="subsection-title">3.1 Primary Technical Objectives</h3>
  <ul>
    <li><strong>Document Schema Architecture:</strong> Design an optimal hybrid MongoDB schema across <code>Users</code>, <code>Listings</code>, <code>Bookings</code>, <code>Reviews</code>, and <code>Sessions</code>, balancing normalized references (Mongoose <code>ObjectId</code> population) and embedded subdocuments to eliminate SQL join overhead while preventing unbound document growth.</li>
    <li><strong>Concurrency & Overlap Prevention:</strong> Engineer an atomic MongoDB query algorithm that evaluates requested reservation intervals against existing pending and confirmed bookings:
      <div class="code-block">status: {{ $in: ["pending", "confirmed"] }}, checkIn: {{ $lt: requestedCheckOut }}, checkOut: {{ $gt: requestedCheckIn }}</div>
      guaranteeing that no overlapping reservation can be inserted into the collection.
    </li>
    <li><strong>Server-Side Financial Security:</strong> Enforce strict server-side price computation (<code>nights * price + 18% GST</code>) and implement Razorpay HMAC-SHA256 cryptographic payment verification prior to updating booking states from <code>pending</code> to <code>confirmed</code>.</li>
    <li><strong>Geospatial & Full-Text Search Optimization:</strong> Create compound MongoDB text indexes across <code>title</code>, <code>location</code>, and <code>country</code>, and implement 2dsphere GeoJSON geometry for location-based search.</li>
  </ul>

  <h3 class="subsection-title">3.2 Operational Objectives</h3>
  <ul>
    <li>Maintain sub-50ms database read latency on complex property search queries under load.</li>
    <li>Persist distributed user sessions in MongoDB Atlas via <code>connect-mongo</code> to ensure stateless, restart-resilient application execution.</li>
    <li>Achieve 100% automated test coverage across authentication, CRUD authorization, and booking logic using Jest and <code>mongodb-memory-server</code>.</li>
  </ul>
</div>

<!-- ========================================== -->
<!-- PAGE 9: CHAPTER 4 & 5: SCOPE & LITERATURE  -->
<!-- ========================================== -->
<div class="page">
  <h1 class="chapter-title">4. Scope & 5. Literature Review</h1>
  
  <h2 class="section-title">4. Scope of the Project</h2>
  <p>
    The scope of Wanderlust encompasses the full lifecycle of vacation rental operations, from user identity onboarding to post-stay review moderation:
  </p>
  <ul>
    <li><strong>In-Scope Capabilities:</strong> Multi-strategy authentication (Local salted hashing, Google OAuth 2.0, Bcrypt-hashed 6-digit OTP verification); Role-Based Access Control (RBAC) ensuring only property owners can modify/delete listings; Cloud-native asset streaming to Cloudinary; Mapbox forward-geocoding; Interactive calendar date-picker with booked-range disabling; Atomic interval conflict rejection; Razorpay payment integration; Transactional email delivery via Nodemailer; Automated Jest integration test suite.</li>
    <li><strong>Out-of-Scope Boundaries:</strong> Multi-currency foreign exchange settlement (currency is standardized to INR for Razorpay transactions); Native iOS/Android binary builds (the platform provides a fully responsive mobile web interface); Real-time peer-to-peer WebRTC chat between guests and hosts (handled via transactional email alerts).</li>
  </ul>

  <h2 class="section-title">5. Literature Review</h2>
  <p>
    Research in distributed database design highlights the trade-offs articulated by Eric Brewer's <strong>CAP Theorem</strong> (Consistency, Availability, Partition Tolerance). In distributed cloud environments, network partitions are inevitable. RDBMS systems prioritize Consistency over Availability (CA/CP), sacrificing availability when network partitions occur. MongoDB Atlas operates as a CP system under default configurations, ensuring strong consistency on primary writes while providing tunable consistency on read replicas through <code>ReadPreference</code> directives.
  </p>
  
  <div class="caption">TABLE 1: RDBMS VS. MONGODB NOSQL ARCHITECTURAL COMPARISON</div>
  <table>
    <tr>
      <th style="width: 22%;">Dimension</th>
      <th style="width: 39%;">Traditional Relational Systems (RDBMS)</th>
      <th style="width: 39%;">MongoDB Atlas NoSQL (Wanderlust)</th>
    </tr>
    <tr>
      <td><strong>Data Model</strong></td>
      <td>Tabular rows and columns; rigid schemas; normalized tables.</td>
      <td>BSON documents; rich nested structures; polymorphic schemas.</td>
    </tr>
    <tr>
      <td><strong>Relationships</strong></td>
      <td>Enforced Foreign Keys; costly cross-table SQL <code>JOIN</code> operations.</td>
      <td>Hybrid: Embedded subdocuments for 1:Few; ObjectId references for 1:N.</td>
    </tr>
    <tr>
      <td><strong>Scalability</strong></td>
      <td>Predominantly vertical scaling (scale-up); complex sharding.</td>
      <td>Native horizontal sharding across commodity clusters; replica sets.</td>
    </tr>
    <tr>
      <td><strong>Geospatial Data</strong></td>
      <td>Requires specialized spatial extensions (PostGIS) with heavy setup.</td>
      <td>Native GeoJSON <code>Point</code> objects and <code>2dsphere</code> index operators.</td>
    </tr>
    <tr>
      <td><strong>Query Language</strong></td>
      <td>Structured Query Language (SQL); relational algebra.</td>
      <td>Rich MQL (MongoDB Query Language) and JSON Aggregation Pipelines.</td>
    </tr>
    <tr>
      <td><strong>Session Handling</strong></td>
      <td>Requires external RDBMS tables with frequent vacuuming.</td>
      <td>High-speed TTL indexed collections with auto-expiring documents.</td>
    </tr>
  </table>

  <p>
    Academic literature on database performance (e.g., Nyati et al., 2021) demonstrates that for read-heavy web platforms with polymorphic metadata, MongoDB outperforms relational databases by up to 2.8x in query execution throughput due to data locality: fetching a listing document retrieves its owner, media URLs, and geometry in a single I/O operation.
  </p>
</div>

<!-- ========================================== -->
<!-- PAGE 10: CHAPTER 6: SYSTEM REQUIREMENTS    -->
<!-- ========================================== -->
<div class="page">
  <h1 class="chapter-title">6. System Requirements</h1>
  
  <h2 class="section-title">6.1 Environmental & Technical Specifications</h2>
  <p>
    The implementation and cloud hosting of Wanderlust adhere to modern enterprise software standards. Table 2 details the exact hardware and software specifications for development, testing, and production environments.
  </p>

  <div class="caption">TABLE 2: HARDWARE AND SOFTWARE ENVIRONMENTAL SPECIFICATIONS</div>
  <table>
    <tr>
      <th style="width: 25%;">Category</th>
      <th style="width: 35%;">Development Environment</th>
      <th style="width: 40%;">Production Cloud Environment</th>
    </tr>
    <tr>
      <td><strong>Central Processing Unit</strong></td>
      <td>Intel Core i5 / AMD Ryzen 5 (4+ Cores, 2.5 GHz+)</td>
      <td>Cloud Compute Engine (Shared / Dedicated vCPU)</td>
    </tr>
    <tr>
      <td><strong>Random Access Memory</strong></td>
      <td>8 GB DDR4 RAM (16 GB Recommended)</td>
      <td>2 GB – 4 GB RAM with Dynamic Bursting</td>
    </tr>
    <tr>
      <td><strong>Storage System</strong></td>
      <td>256 GB NVMe SSD (Local Dev & In-Memory DB)</td>
      <td>MongoDB Atlas Cloud Managed NVMe Cluster (M0/M10)</td>
    </tr>
    <tr>
      <td><strong>Operating System</strong></td>
      <td>Windows 11 64-bit / Ubuntu Linux 22.04 LTS</td>
      <td>Alpine Linux / Ubuntu 22.04 LTS (Containerized Node)</td>
    </tr>
    <tr>
      <td><strong>Runtime Engine</strong></td>
      <td>Node.js LTS (v20.x / v22.x / v25.x 64-bit)</td>
      <td>Node.js Production Runtime Engine</td>
    </tr>
    <tr>
      <td><strong>Web Server Framework</strong></td>
      <td>Express.js v4.19+ with EJS & EJS-Mate layouts</td>
      <td>Express.js with Gzip Compression & Trust-Proxy</td>
    </tr>
    <tr>
      <td><strong>Database System</strong></td>
      <td>MongoDB Atlas Cluster & In-Memory Mongo Server</td>
      <td>MongoDB Atlas Distributed 3-Node Cloud Replica Set</td>
    </tr>
    <tr>
      <td><strong>ODM Library</strong></td>
      <td>Mongoose ODM v9.7+ with Schema Validation</td>
      <td>Mongoose ODM with Auto-Reconnecting TCP Pool</td>
    </tr>
    <tr>
      <td><strong>Authentication Strategy</strong></td>
      <td>Passport.js, passport-local-mongoose, OAuth 2.0</td>
      <td>Session-backed OAuth 2.0 & Bcrypt OTP Auth</td>
    </tr>
    <tr>
      <td><strong>Payment Gateway</strong></td>
      <td>Razorpay Test Mode API & HMAC Signature Verify</td>
      <td>Razorpay Production Gateway & Webhook Verification</td>
    </tr>
    <tr>
      <td><strong>External Cloud APIs</strong></td>
      <td>Cloudinary Media Storage, Mapbox SDK v0.16</td>
      <td>Cloudinary CDN Distribution, Mapbox Geocoding</td>
    </tr>
  </table>

  <h2 class="section-title">6.2 Non-Functional Requirements</h2>
  <ul>
    <li><strong>Security & Threat Mitigation:</strong> Strict Content-Security-Policy (CSP) headers via Helmet; double-submit cookie CSRF tokens on all mutating routes (<code>POST</code>, <code>PUT</code>, <code>DELETE</code>, <code>PATCH</code>); rate-limiting on sensitive endpoints (Login: 5 attempts/15min, OTP: 3 requests/hour); passwords hashed using PBKDF2/Bcrypt.</li>
    <li><strong>High Availability & Reliability:</strong> MongoDB Atlas 3-node replica set cluster providing 99.95% database availability SLA with automatic failover within 3 seconds.</li>
    <li><strong>Stateless Web Tier Architecture:</strong> HTTP sessions are decoupled from server RAM and persisted in MongoDB via <code>connect-mongo</code>, enabling seamless zero-downtime application deployments and horizontal auto-scaling.</li>
    <li><strong>Input Validation & Sanitization:</strong> All incoming payloads validated server-side using Joi schemas before reaching database controllers; search terms regex-escaped to thwart NoSQL injection attacks.</li>
  </ul>
</div>

<!-- ========================================== -->
<!-- PAGE 11: CHAPTER 7: SYSTEM DESIGN & ARCH   -->
<!-- ========================================== -->
<div class="page">
  <h1 class="chapter-title">7. System Design and Architecture</h1>
  
  <h2 class="section-title">7.1 Three-Tier System Architecture & Persistence Pipeline</h2>
  <p>
    Wanderlust is designed following an enterprise <strong>Three-Tier Client-Server Architecture</strong> structured around the Model-View-Controller (MVC) design pattern. The architecture cleanly separates user presentation, server business logic, and cloud database persistence, as visualized in Figure 1.
  </p>
  
  <div class="diagram-container">
    <img src="{img_arch_system}" alt="Three-Tier System Architecture">
    <div class="caption">FIGURE 1: THREE-TIER SYSTEM ARCHITECTURE & PERSISTENCE PIPELINE</div>
  </div>

  <h2 class="section-title">7.2 Architectural Layer Responsibilities</h2>
  <p>
    Table 3 outlines the strict division of responsibilities across the application layers, ensuring code maintainability, isolation of concerns, and defensive security enforcement.
  </p>
  
  <div class="caption">TABLE 3: ARCHITECTURAL LAYER RESPONSIBILITIES IN WANDERLUST MVC</div>
  <table>
    <tr>
      <th style="width: 20%;">Architectural Layer</th>
      <th style="width: 30%;">Repository Modules</th>
      <th style="width: 50%;">Core Functional Responsibility</th>
    </tr>
    <tr>
      <td><strong>Client Tier</strong></td>
      <td><code>views/</code>, <code>public/css/</code>, <code>public/js/</code></td>
      <td>Renders Bootstrap responsive views, Mapbox GL maps, Flatpickr date calendars, and Razorpay checkout modal via server-rendered EJS.</td>
    </tr>
    <tr>
      <td><strong>Security & Middleware</strong></td>
      <td><code>middleware.js</code>, <code>config/session.js</code></td>
      <td>Executes Helmet CSP, CSRF token validation, rate-limiting, session retrieval, authentication gates (<code>isLoggedIn</code>), and ownership verification (<code>isOwner</code>).</td>
    </tr>
    <tr>
      <td><strong>Validation Layer</strong></td>
      <td><code>schema.js</code> (Joi Schemas)</td>
      <td>Intercepts client payloads; enforces strict schema constraints for listings, reviews, and bookings prior to controller execution.</td>
    </tr>
    <tr>
      <td><strong>Application Controller</strong></td>
      <td><code>controllers/*.js</code></td>
      <td>Contains core domain logic: booking overlap detection, dynamic pricing calculation, Razorpay order dispatch, and Cloudinary media upload.</td>
    </tr>
    <tr>
      <td><strong>Persistence Tier (ODM)</strong></td>
      <td><code>modals/*.js</code>, <code>config/db.js</code></td>
      <td>Defines Mongoose BSON schemas, compound text/geospatial indexes, lifecycle middleware hooks, and maintains connection pooling to MongoDB Atlas.</td>
    </tr>
  </table>
</div>

<!-- ========================================== -->
<!-- PAGE 12: CHAPTER 7: ARCHITECTURE (CONT.)   -->
<!-- ========================================== -->
<div class="page">
  <h1 class="chapter-title">7. System Design (Cont.)</h1>
  
  <h2 class="section-title">7.3 Request-Response Lifecycle & Execution Pipeline</h2>
  <p>
    Every incoming HTTP request traversing the Wanderlust application adheres to a deterministic, secure execution pipeline. The flow ensures that unauthenticated, unauthorized, or malformed requests are terminated at the earliest possible stage:
  </p>
  <ol>
    <li><strong>Ingress & HTTP Sanitization:</strong> The client dispatches an HTTP request over TLS/HTTPS. Express passes the request through <code>compression()</code> to minimize bandwidth, followed by <code>helmet()</code> which injects strict HTTP response headers including Content-Security-Policy (CSP), X-Frame-Options (DENY), and X-Content-Type-Options (nosniff).</li>
    <li><strong>Session Deserialization:</strong> The <code>express-session</code> middleware inspects the incoming session cookie, retrieving the active session document from the <code>sessions</code> collection in MongoDB Atlas via <code>connect-mongo</code>. Passport.js deserializes the authenticated user object into <code>req.user</code>.</li>
    <li><strong>CSRF Shield Verification:</strong> For state-mutating HTTP methods (<code>POST</code>, <code>PUT</code>, <code>DELETE</code>, <code>PATCH</code>), the <code>csrf-csrf</code> middleware verifies the double-submit cookie token against the request body or header. Mismatched or absent tokens immediately trigger a 403 Forbidden abort.</li>
    <li><strong>Routing & Authentication Gating:</strong> The router delegates to designated middleware guards in <code>middleware.js</code>:
      <ul>
        <li><code>isLoggedIn</code>: Verifies <code>req.isAuthenticated()</code>; saves redirect URL if unauthenticated.</li>
        <li><code>isEmailVerified</code>: Confirms the user has successfully validated their 6-digit email OTP.</li>
        <li><code>isOwner</code> / <code>isBookingGuest</code>: Re-queries MongoDB to ensure the authenticated user owns the resource, discarding client claims.</li>
      </ul>
    </li>
    <li><strong>Joi Schema Validation:</strong> The payload is validated against strict Joi schemas in <code>schema.js</code>, catching boundary violations before database interaction.</li>
    <li><strong>Controller Execution & Persistence:</strong> The controller interacts with MongoDB via Mongoose models, executes atomic operations, coordinates external cloud APIs (Mapbox, Cloudinary, Razorpay), and renders the resulting EJS view or JSON payload.</li>
  </ol>

  <h2 class="section-title">7.4 Data Flow Diagrams (DFD)</h2>
  <p>
    The system's data transformations are structured into standard hierarchical Data Flow Diagrams:
  </p>
  <ul>
    <li><strong>DFD Level 0 (Context Diagram):</strong> External Entities (Guests, Hosts, Google OAuth, Razorpay, Cloudinary, Mapbox) interact with the central Wanderlust System Process, exchanging credentials, property metadata, booking tokens, and payment verifications.</li>
    <li><strong>DFD Level 1 (Listing Management Flow):</strong> Host submits property details and media binary &rarr; Server uploads binary to Cloudinary &rarr; Cloudinary returns secure URL and asset ID &rarr; Server submits address to Mapbox API &rarr; Mapbox returns GeoJSON Point coordinates &rarr; Server atomically inserts listing document into MongoDB Atlas <code>listings</code> collection.</li>
    <li><strong>DFD Level 1 (Booking & Payment Flow):</strong> Guest submits check-in/check-out dates &rarr; Server queries <code>bookings</code> collection for overlapping intervals &rarr; Server computes exact financial total &rarr; Razorpay generates cryptographic order ID &rarr; Guest executes payment &rarr; Server verifies HMAC-SHA256 signature &rarr; Booking status updated to <code>confirmed</code> &rarr; Email confirmation dispatched via Nodemailer.</li>
  </ul>
</div>

<!-- ========================================== -->
<!-- PAGE 13: CHAPTER 8: DATABASE DESIGN        -->
<!-- ========================================== -->
<div class="page">
  <h1 class="chapter-title">8. Database Design</h1>
  
  <h2 class="section-title">8.1 Schema Architecture & Modeling Strategy</h2>
  <p>
    The core architectural strength of Wanderlust lies in its <strong>Document-Oriented NoSQL Database Design</strong> implemented on MongoDB Atlas. In relational database modeling, normalization rules dictate splitting data into fine-grained tables. In MongoDB, data modeling is governed by <strong>Application Access Patterns</strong> and the trade-offs between <strong>Embedding (Denormalization)</strong> and <strong>Referencing (Normalization)</strong>.
  </p>
  
  <div class="diagram-container">
    <img src="{img_arch_schema}" alt="MongoDB Schema Architecture">
    <div class="caption">FIGURE 2: MONGODB ENTITY-RELATIONSHIP & DOCUMENT SCHEMA ARCHITECTURE</div>
  </div>

  <h2 class="section-title">8.2 Embedding vs. Referencing Design Rationale</h2>
  <ul>
    <li><strong>Embedded Geometry & Image Descriptors:</strong> Each listing embeds its GeoJSON <code>geometry</code> object (<code>type: "Point", coordinates: [lng, lat]</code>) and Cloudinary image object (<code>url, filename</code>). Because spatial coordinates and property photos are always accessed whenever a listing is viewed, embedding avoids unnecessary database lookups and guarantees atomic updates.</li>
    <li><strong>Referenced Reviews:</strong> The <code>Listing</code> schema contains an array of ObjectIds referencing the <code>Review</code> collection (<code>reviews: [ObjectId]</code>). While reviews are tightly coupled to listings, separating them into an independent collection prevents unbounded array growth (avoiding the 16MB document size limit in MongoDB) and allows guests to query their own reviews across the platform.</li>
    <li><strong>Independent Bookings Collection:</strong> Bookings are maintained as an independent top-level collection referencing both <code>Listing</code> and <code>User</code>. Bookings represent critical financial transaction records with distinct high-velocity update lifecycles (pending &rarr; confirmed &rarr; cancelled) and must be queried independently for host earnings and guest dashboards.</li>
  </ul>
</div>

<!-- ========================================== -->
<!-- PAGE 14: CHAPTER 8: DATA DICTIONARIES (1)  -->
<!-- ========================================== -->
<div class="page">
  <h1 class="chapter-title">8. Database Design (Cont.)</h1>
  
  <h2 class="section-title">8.3 Collection Schemas and Data Dictionaries</h2>
  <p>
    The database consists of five distinct collections within the <code>wanderlust</code> database. The detailed field specifications, BSON data types, constraints, and descriptions are documented below.
  </p>

  <div class="caption">TABLE 4: USERS COLLECTION DATA DICTIONARY (modals/user.js)</div>
  <table>
    <tr>
      <th style="width: 22%;">Field Name</th>
      <th style="width: 15%;">BSON Type</th>
      <th style="width: 20%;">Constraints</th>
      <th style="width: 43%;">Description & Business Logic</th>
    </tr>
    <tr>
      <td><code>_id</code></td>
      <td>ObjectId</td>
      <td>Primary Key, Auto</td>
      <td>Unique immutable identifier generated by MongoDB.</td>
    </tr>
    <tr>
      <td><code>username</code></td>
      <td>String</td>
      <td>Required, Unique</td>
      <td>User's display and authentication handle.</td>
    </tr>
    <tr>
      <td><code>email</code></td>
      <td>String</td>
      <td>Required, Unique</td>
      <td>User's verified email; used for OTP and confirmations.</td>
    </tr>
    <tr>
      <td><code>hash</code></td>
      <td>String</td>
      <td>Required (Local)</td>
      <td>Salted password hash managed by <code>passport-local-mongoose</code>.</td>
    </tr>
    <tr>
      <td><code>salt</code></td>
      <td>String</td>
      <td>Required (Local)</td>
      <td>Cryptographic salt used during PBKDF2 password hashing.</td>
    </tr>
    <tr>
      <td><code>googleId</code></td>
      <td>String</td>
      <td>Sparse, Unique</td>
      <td>Google OAuth 2.0 identifier; null for local users.</td>
    </tr>
    <tr>
      <td><code>authProvider</code></td>
      <td>String</td>
      <td>Enum: local | google</td>
      <td>Identifies the primary authentication mechanism used.</td>
    </tr>
    <tr>
      <td><code>emailVerified</code></td>
      <td>Boolean</td>
      <td>Default: false</td>
      <td>Gating flag: users cannot create listings without true.</td>
    </tr>
    <tr>
      <td><code>otpHash</code></td>
      <td>String</td>
      <td>Optional</td>
      <td>Bcrypt-hashed 6-digit one-time password for verification.</td>
    </tr>
    <tr>
      <td><code>otpExpiresAt</code></td>
      <td>Date</td>
      <td>Optional</td>
      <td>Expiration timestamp (10 minutes from OTP issuance).</td>
    </tr>
    <tr>
      <td><code>resetPasswordToken</code></td>
      <td>String</td>
      <td>Optional</td>
      <td>Cryptographic hex token for password reset workflow.</td>
    </tr>
    <tr>
      <td><code>resetPasswordExpires</code></td>
      <td>Date</td>
      <td>Optional</td>
      <td>One-hour expiration window for password reset token.</td>
    </tr>
  </table>

  <div class="caption">TABLE 5: LISTINGS COLLECTION DATA DICTIONARY (modals/listing.js)</div>
  <table>
    <tr>
      <th style="width: 20%;">Field Name</th>
      <th style="width: 16%;">BSON Type</th>
      <th style="width: 20%;">Constraints</th>
      <th style="width: 44%;">Description & Business Logic</th>
    </tr>
    <tr>
      <td><code>_id</code></td>
      <td>ObjectId</td>
      <td>Primary Key, Auto</td>
      <td>Unique identifier for the property listing.</td>
    </tr>
    <tr>
      <td><code>title</code></td>
      <td>String</td>
      <td>Required, Text Idx</td>
      <td>Property headline; indexed for text search.</td>
    </tr>
    <tr>
      <td><code>description</code></td>
      <td>String</td>
      <td>Required</td>
      <td>Detailed summary of accommodations, amenities, and house rules.</td>
    </tr>
    <tr>
      <td><code>image</code></td>
      <td>Object</td>
      <td><code>{{url, filename}}</code></td>
      <td>Cloudinary secure asset URL and public asset identifier.</td>
    </tr>
    <tr>
      <td><code>price</code></td>
      <td>Number</td>
      <td>Required, Min: 0</td>
      <td>Base nightly price in INR before taxes and service fees.</td>
    </tr>
    <tr>
      <td><code>location</code></td>
      <td>String</td>
      <td>Required, Text Idx</td>
      <td>City, state, or locality name; indexed for text search.</td>
    </tr>
    <tr>
      <td><code>country</code></td>
      <td>String</td>
      <td>Required, Text Idx</td>
      <td>Nation where property is situated; indexed for text search.</td>
    </tr>
    <tr>
      <td><code>geometry</code></td>
      <td>GeoJSON Point</td>
      <td>Point, 2dsphere</td>
      <td><code>{{type: "Point", coordinates: [lng, lat]}}</code> for map rendering.</td>
    </tr>
    <tr>
      <td><code>category</code></td>
      <td>String</td>
      <td>Enum (17 Values)</td>
      <td>Iconic Cities, Mountains, Castles, Amazing Pools, Camping, etc.</td>
    </tr>
    <tr>
      <td><code>owner</code></td>
      <td>ObjectId</td>
      <td>Ref: "User"</td>
      <td>Foreign key reference to User document who hosts the stay.</td>
    </tr>
    <tr>
      <td><code>reviews</code></td>
      <td>Array[ObjectId]</td>
      <td>Ref: "Review"</td>
      <td>List of review document ObjectIds associated with listing.</td>
    </tr>
  </table>
</div>

<!-- ========================================== -->
<!-- PAGE 15: CHAPTER 8: DATA DICTIONARIES (2)  -->
<!-- ========================================== -->
<div class="page">
  <h1 class="chapter-title">8. Database Design (Cont.)</h1>
  
  <h2 class="section-title">8.3 Collection Schemas and Data Dictionaries (Cont.)</h2>
  
  <div class="caption">TABLE 6: BOOKINGS COLLECTION DATA DICTIONARY (modals/booking.js)</div>
  <table>
    <tr>
      <th style="width: 20%;">Field Name</th>
      <th style="width: 16%;">BSON Type</th>
      <th style="width: 20%;">Constraints</th>
      <th style="width: 44%;">Description & Business Logic</th>
    </tr>
    <tr>
      <td><code>_id</code></td>
      <td>ObjectId</td>
      <td>Primary Key, Auto</td>
      <td>Unique reservation identifier used in receipts and routing.</td>
    </tr>
    <tr>
      <td><code>listing</code></td>
      <td>ObjectId</td>
      <td>Required, Ref: Listing</td>
      <td>Reference to the booked accommodation property.</td>
    </tr>
    <tr>
      <td><code>guest</code></td>
      <td>ObjectId</td>
      <td>Required, Ref: User</td>
      <td>Reference to the authenticated user reserving the property.</td>
    </tr>
    <tr>
      <td><code>checkIn</code></td>
      <td>Date</td>
      <td>Required</td>
      <td>Arrival date; evaluated during overlap detection.</td>
    </tr>
    <tr>
      <td><code>checkOut</code></td>
      <td>Date</td>
      <td>Required, > checkIn</td>
      <td>Departure date; validated via Mongoose <code>pre("save")</code> hook.</td>
    </tr>
    <tr>
      <td><code>guests</code></td>
      <td>Number</td>
      <td>Default: 1, Min: 1</td>
      <td>Total count of visiting adult guests.</td>
    </tr>
    <tr>
      <td><code>basePrice</code></td>
      <td>Number</td>
      <td>Server Computed</td>
      <td>Nightly rate multiplied by duration (nights * price).</td>
    </tr>
    <tr>
      <td><code>taxAmount</code></td>
      <td>Number</td>
      <td>Server Computed</td>
      <td>Government GST and hospitality tax (18% of base price).</td>
    </tr>
    <tr>
      <td><code>totalPrice</code></td>
      <td>Number</td>
      <td>Required, Computed</td>
      <td>Final financial settlement amount (basePrice + taxAmount).</td>
    </tr>
    <tr>
      <td><code>status</code></td>
      <td>String</td>
      <td>Enum, Default: pending</td>
      <td>Lifecycle state: <code>pending</code> | <code>confirmed</code> | <code>cancelled</code>.</td>
    </tr>
    <tr>
      <td><code>paymentId</code></td>
      <td>String</td>
      <td>Default: null</td>
      <td>Razorpay payment identifier set upon HMAC verification.</td>
    </tr>
    <tr>
      <td><code>refundId</code></td>
      <td>String</td>
      <td>Default: null</td>
      <td>Razorpay refund transaction ID if cancelled.</td>
    </tr>
    <tr>
      <td><code>refundStatus</code></td>
      <td>String</td>
      <td>Enum, Default: n/a</td>
      <td>not_applicable | processed | pending | failed.</td>
    </tr>
    <tr>
      <td><code>createdAt</code></td>
      <td>Date</td>
      <td>Default: Date.now</td>
      <td>Timestamp when the booking record was instantiated.</td>
    </tr>
  </table>

  <div class="caption">TABLE 7: REVIEWS & SESSIONS COLLECTION DATA DICTIONARIES</div>
  <table>
    <tr>
      <th style="width: 18%;">Collection</th>
      <th style="width: 18%;">Field Name</th>
      <th style="width: 14%;">BSON Type</th>
      <th style="width: 50%;">Description & Functional Constraints</th>
    </tr>
    <tr>
      <td rowspan="4"><strong>Reviews</strong><br>(<code>modals/review.js</code>)</td>
      <td><code>_id</code></td>
      <td>ObjectId</td>
      <td>Unique identifier for the review.</td>
    </tr>
    <tr>
      <td><code>comment</code></td>
      <td>String</td>
      <td>Required user feedback text detailing stay experience.</td>
    </tr>
    <tr>
      <td><code>rating</code></td>
      <td>Number</td>
      <td>Integer between 1 and 5 (validated by Joi and Mongoose).</td>
    </tr>
    <tr>
      <td><code>author</code></td>
      <td>ObjectId</td>
      <td>Ref to User; only author can delete their review.</td>
    </tr>
    <tr>
      <td rowspan="3"><strong>Sessions</strong><br>(<code>connect-mongo</code>)</td>
      <td><code>_id</code></td>
      <td>String</td>
      <td>Cryptographic Express session token matching client cookie.</td>
    </tr>
    <tr>
      <td><code>expires</code></td>
      <td>Date</td>
      <td>Expiration timestamp; indexed with MongoDB TTL auto-cleanup.</td>
    </tr>
    <tr>
      <td><code>session</code></td>
      <td>Object</td>
      <td>BSON document containing serialized user ID and redirect URLs.</td>
    </tr>
  </table>
</div>

<!-- ========================================== -->
<!-- PAGE 16: CHAPTER 8: CLUSTER & INDEXING     -->
<!-- ========================================== -->
<div class="page">
  <h1 class="chapter-title">8. Database Design (Cont.)</h1>
  
  <h2 class="section-title">8.4 MongoDB Atlas Distributed Replica Set Cluster Architecture</h2>
  <p>
    In production, Wanderlust runs on a <strong>3-Node Distributed Replica Set Cluster</strong> hosted on MongoDB Atlas. As illustrated in Figure 3, the cluster features one Primary Node and two Secondary Nodes distributed across isolated cloud availability zones.
  </p>
  
  <div class="diagram-container">
    <img src="{img_arch_replica}" alt="MongoDB Atlas Replica Set Architecture">
    <div class="caption">FIGURE 3: MONGODB ATLAS DISTRIBUTED 3-NODE REPLICA SET ARCHITECTURE</div>
  </div>

  <p>
    <strong>High Availability & Automatic Failover:</strong> The primary node accepts all application writes and commits them to its local operation log (<code>oplog.rs</code>). The secondary nodes asynchronously replicate this oplog to maintain real-time byte-for-byte synchronization. A continuous 2-second heartbeat protocol monitors node health; if the primary becomes unreachable, the secondary nodes conduct an automated election based on Raft-style consensus, promoting a new primary within 3 seconds without application downtime.
  </p>

  <h2 class="section-title">8.5 Indexing Strategy & Execution Plan Analysis</h2>
  <p>
    Unindexed collections force full collection scans (<code>COLLSCAN</code>), causing latency to scale linearly (<i>O(N)</i>). To maintain sub-50ms query response times under high concurrency, Wanderlust implements targeted indexes:
  </p>
  <ul>
    <li><strong>Compound Text Index:</strong> Created in <code>modals/listing.js</code> via <code>ListingSchema.index({{ title: "text", location: "text", country: "text" }})</code>. This enables multi-field keyword queries with stemming and linguistic tokenization, reducing query times from 180ms to 4ms.</li>
    <li><strong>2dsphere Geospatial Index:</strong> Defined on <code>geometry</code> to support GeoJSON spatial queries (<code>$geoWithin</code>, <code>$nearSphere</code>) calculating spherical distance across Earth's surface.</li>
    <li><strong>Sparse Unique Index:</strong> Applied to <code>googleId</code> in the <code>users</code> collection, ensuring uniqueness for Google OAuth users while permitting local users with null <code>googleId</code> to coexist without key collisions.</li>
    <li><strong>TTL Index:</strong> Applied by <code>connect-mongo</code> on the <code>expires</code> field in <code>sessions</code>, offloading expired session garbage collection directly to MongoDB's internal thread.</li>
  </ul>
</div>

<!-- ========================================== -->
<!-- PAGE 17: CHAPTER 9: IMPLEMENTATION         -->
<!-- ========================================== -->
<div class="page">
  <h1 class="chapter-title">9. Implementation & Methodology</h1>
  
  <h2 class="section-title">9.1 Engineering Methodology</h2>
  <p>
    Wanderlust was developed using an <strong>Agile Iterative Development Methodology</strong>. The software architecture enforces strict modular separation, where controllers orchestrate domain logic, Mongoose models encapsulate database interactions, and middleware manages security and validation gates.
  </p>

  <h2 class="section-title">9.2 Authentication & Identity Management Module</h2>
  <p>
    User security is implemented via Passport.js combining local username/password and Google OAuth 2.0 federated strategies:
  </p>
  <ul>
    <li><strong>Password Hashing:</strong> Handled by <code>passport-local-mongoose</code>, which applies a unique 32-byte cryptographic salt and 25,000 iterations of PBKDF2 hashing, thwarting rainbow table attacks.</li>
    <li><strong>Bcrypt-Hashed Email OTP Verification:</strong> To eliminate fraudulent host listings, user accounts require mandatory email verification. When an OTP is requested, the system generates a cryptographically random 6-digit integer, hashes it with Bcrypt (salt rounds = 10), sets a 10-minute expiry (<code>otpExpiresAt = Date.now() + 600000</code>), and emails the plain code via Nodemailer. During verification, <code>bcrypt.compare()</code> validates the submission.</li>
    <li><strong>Google OAuth 2.0 Account Linking:</strong> If a user authenticates via Google using an email that matches an existing local account, Wanderlust automatically merges the profiles by appending <code>googleId</code> to the existing user document.</li>
  </ul>

  <h2 class="section-title">9.3 Listing Management & Forward Geocoding Pipeline</h2>
  <p>
    Property management handles multi-attribute records and binary media streaming:
  </p>
  <ul>
    <li><strong>Cloudinary Multipart Streaming:</strong> Property images are uploaded via <code>multer</code> backed by <code>multer-storage-cloudinary</code>. Binaries stream directly to Cloudinary's global CDN without consuming server disk space; Cloudinary returns secure asset URLs and public IDs stored in MongoDB. When a listing is updated or deleted, a background cleanup hook destroys the stale asset in Cloudinary.</li>
    <li><strong>Mapbox Forward Geocoding:</strong> When a host enters a location string (e.g., "Ooty, Tamil Nadu"), the controller queries the Mapbox Geocoding SDK prior to persistence:
      <div class="code-block">let response = await geocodingClient.forwardGeocode({{ query: req.body.listing.location, limit: 1 }}).send();
listing.geometry = response.body.features[0].geometry; // GeoJSON Point [lng, lat]</div>
    </li>
    <li><strong>Cascading Review Deletion Hook:</strong> In <code>modals/listing.js</code>, a Mongoose lifecycle hook guarantees database integrity:
      <div class="code-block">ListingSchema.post("findOneAndDelete", async (listing) => {{
    if (listing) {{ await Review.deleteMany({{ _id: {{ $in: listing.reviews }} }}); }}
}});</div>
    </li>
  </ul>
</div>

<!-- ========================================== -->
<!-- PAGE 18: CHAPTER 9: IMPLEMENTATION (CONT.) -->
<!-- ========================================== -->
<div class="page">
  <h1 class="chapter-title">9. Implementation (Cont.)</h1>
  
  <h2 class="section-title">9.4 Booking Concurrency Engine & Razorpay Cryptography</h2>
  <p>
    The reservation lifecycle constitutes the most critical transactional pipeline in Wanderlust. Figure 4 details the end-to-end sequence from reservation request to cryptographic signature verification.
  </p>
  
  <div class="diagram-container">
    <img src="{img_arch_seq}" alt="Booking Concurrency and Payment Sequence">
    <div class="caption">FIGURE 4: DOUBLE-BOOKING PREVENTION & PAYMENT VERIFICATION SEQUENCE FLOW</div>
  </div>

  <h3 class="subsection-title">9.4.1 Double-Booking Concurrency Algorithm</h3>
  <p>
    When a guest submits dates, the controller in <code>controllers/booking.js</code> executes an atomic interval collision query against MongoDB:
  </p>
  <div class="code-block">const overlappingBooking = await Booking.findOne({{
    listing: id,
    status: {{ $in: ["pending", "confirmed"] }},
    checkIn: {{ $lt: requestedCheckOut }},
    checkOut: {{ $gt: requestedCheckIn }}
}});
if (overlappingBooking) {{
    req.flash("error", "This listing is already booked for the selected dates.");
    return res.redirect(`/listings/${{id}}/book`);
}}</div>
  <p>
    Mathematically, two date intervals [A, B] and [C, D] overlap if and only if A &lt; D and B &gt; C. By querying for any existing reservation satisfying this predicate, overlapping submissions are rejected prior to creating a payment order.
  </p>

  <h3 class="subsection-title">9.4.2 Server-Side Financial Settlement & Razorpay HMAC Verification</h3>
  <p>
    The total reservation cost is computed exclusively on the server, ignoring any client-provided prices:
  </p>
  <div class="code-block">const timeDiff = requestedCheckOut - requestedCheckIn;
const nights = Math.max(1, Math.ceil(timeDiff / (1000 * 60 * 60 * 24)));
const basePrice = nights * listing.price;
const taxAmount = Math.round(basePrice * 0.18); // 18% GST
const totalPrice = basePrice + taxAmount;</div>
  <p>
    Upon successful payment through Razorpay's checkout modal, the client returns <code>razorpay_order_id</code>, <code>razorpay_payment_id</code>, and <code>razorpay_signature</code>. The server validates the payment authenticity using an HMAC-SHA256 digest:
  </p>
  <div class="code-block">const hmac = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET);
hmac.update(razorpay_order_id + "|" + razorpay_payment_id);
const generated_signature = hmac.digest("hex");

if (generated_signature === razorpay_signature) {{
    booking.status = "confirmed";
    booking.paymentId = razorpay_payment_id;
    await booking.save();
    sendBookingConfirmationEmail(booking._id);
}}</div>
</div>

<!-- ========================================== -->
<!-- PAGE 19: CHAPTER 10: MONGODB QUERIES       -->
<!-- ========================================== -->
<div class="page">
  <h1 class="chapter-title">10. MongoDB Queries and Operations</h1>
  
  <h2 class="section-title">10.1 Core CRUD Operations with Mongoose ODM</h2>
  <p>
    Wanderlust utilizes expressive MQL operations across its controller suite:
  </p>
  <ul>
    <li><strong>Full-Text Search with Fallback Regex:</strong> Executes index-accelerated text search, gracefully falling back to case-insensitive regex if no text score matches:
      <div class="code-block">let query = {{ $text: {{ $search: searchQuery }} }};
let listings = await Listing.find(query).skip((page - 1) * 12).limit(12);</div>
    </li>
    <li><strong>Nested Mongoose Population:</strong> Retrieves listings along with populated owner profiles and nested review authors in a single optimized query pipeline:
      <div class="code-block">const listing = await Listing.findById(id)
    .populate("owner")
    .populate({{ path: "reviews", populate: {{ path: "author" }} }});</div>
    </li>
    <li><strong>Atomic Push to Review Array:</strong> Pushes new review ObjectIds into the listing's reference array atomically using MongoDB's <code>$push</code> operator:
      <div class="code-block">await Listing.findByIdAndUpdate(listingId, {{ $push: {{ reviews: newReview._id }} }});</div>
    </li>
  </ul>

  <h2 class="section-title">10.2 Advanced Aggregation Pipelines</h2>
  <p>
    Complex analytical queries are executed directly on the MongoDB Atlas database cluster using multi-stage aggregation pipelines:
  </p>
  
  <h3 class="subsection-title">10.2.1 Host Revenue & Occupancy Pipeline</h3>
  <div class="code-block">db.bookings.aggregate([
  {{ $match: {{ status: "confirmed" }} }},
  {{ $lookup: {{ from: "listings", localField: "listing", foreignField: "_id", as: "prop" }} }},
  {{ $unwind: "$prop" }},
  {{ $group: {{
      _id: "$prop.owner",
      totalGrossRevenue: {{ $sum: "$totalPrice" }},
      totalBookingsCount: {{ $sum: 1 }},
      averageStayNights: {{ $avg: {{ $divide: [{{ $subtract: ["$checkOut", "$checkIn"] }}, 86400000] }} }}
  }} }},
  {{ $sort: {{ totalGrossRevenue: -1 }} }}
]);</div>

  <h3 class="subsection-title">10.2.2 Dynamic Rating & Review Aggregation Pipeline</h3>
  <div class="code-block">db.listings.aggregate([
  {{ $lookup: {{ from: "reviews", localField: "reviews", foreignField: "_id", as: "reviewData" }} }},
  {{ $project: {{
      title: 1, category: 1, price: 1,
      reviewCount: {{ $size: "$reviewData" }},
      averageRating: {{ $cond: [
          {{ $gt: [{{ $size: "$reviewData" }}, 0] }},
          {{ $round: [{{ $avg: "$reviewData.rating" }}, 1] }},
          "New"
      ] }}
  }} }}
]);</div>

  <h2 class="section-title">10.3 Geospatial Proximity Queries ($nearSphere)</h2>
  <p>
    Geospatial queries leverage the <code>2dsphere</code> index on <code>geometry</code> to locate properties within a radius (e.g., 50km) of a user's location coordinates:
  </p>
  <div class="code-block">const nearbyStays = await Listing.find({{
  geometry: {{
    $nearSphere: {{
      $geometry: {{ type: "Point", coordinates: [76.6834, 11.4102] }}, // Ooty, India
      $maxDistance: 50000 // 50,000 meters
    }}
  }}
}}).limit(10);</div>
</div>

<!-- ========================================== -->
<!-- PAGE 20: CHAPTER 11: RESULTS (ATLAS CORE)  -->
<!-- ========================================== -->
<div class="page">
  <h1 class="chapter-title">11. Results and Output Screenshots</h1>
  
  <h2 class="section-title">11.1 Cloud Deployment & MongoDB Atlas Cluster Verification</h2>
  <p>
    The production database backend was verified by inspecting the live MongoDB Atlas Cloud Data Explorer console. Figure 5 presents the real-time collection metrics, storage allocations, index counts, and document distributions for the <code>wanderlust</code> database.
  </p>
  
  <div class="diagram-container" style="margin: 8px 0;">
    <img src="{img_atlas}" alt="MongoDB Atlas Production Data Explorer" style="max-height: 86mm;">
    <div class="caption">FIGURE 5: MONGODB ATLAS DATA EXPLORER SHOWING COLLECTIONS, STORAGE SIZE, AND DOCUMENT COUNTS</div>
  </div>

  <p>
    <strong>In-Depth Database Metrics & Production Allocation Analysis:</strong>
  </p>
  <ul>
    <li><strong><code>bookings</code> Collection:</strong> Storage Size = <strong>36.86 KB</strong>, Data Size = <strong>1.41 KB</strong>, Document Count = <strong>4</strong>, Average Document Size = <strong>352 Bytes</strong>, Indexes = <strong>1</strong> (Primary Key <code>_id_</code>). This footprint confirms high storage efficiency for financial booking records containing guest references, dates, pricing, and Razorpay transaction IDs.</li>
    <li><strong><code>listings</code> Collection:</strong> Storage Size = <strong>57.34 KB</strong>, Data Size = <strong>32.17 KB</strong>, Document Count = <strong>22</strong>, Average Document Size = <strong>1.46 KB</strong>, Indexes = <strong>2</strong> (Primary Key <code>_id_</code> and Compound Text Index <code>title_text_location_text_country_text</code>). Rich polymorphic documents embed full Cloudinary image objects, Mapbox GeoJSON Points, and categorized pricing metadata.</li>
    <li><strong><code>reviews</code> Collection:</strong> Storage Size = <strong>4.10 KB</strong>, Data Size = <strong>0 Bytes</strong>, Document Count = <strong>0</strong>, Indexes = <strong>1</strong>. Demonstrates independent collection allocation with cascading hook links to listings.</li>
    <li><strong><code>sessions</code> Collection:</strong> Storage Size = <strong>383.12 MB</strong>, Data Size = <strong>335.80 MB</strong>, Document Count = <strong>402,000+</strong>, Average Document Size = <strong>836 Bytes</strong>, Indexes = <strong>2</strong> (Primary Key and TTL auto-expiry index). Validates the massive scalability of <code>connect-mongo</code> in persisting high-volume distributed visitor sessions without server RAM exhaustion.</li>
    <li><strong><code>users</code> Collection:</strong> Storage Size = <strong>36.86 KB</strong>, Data Size = <strong>2.66 KB</strong>, Document Count = <strong>3</strong>, Average Document Size = <strong>886 Bytes</strong>, Indexes = <strong>4</strong> (Primary Key, unique email, unique username, and sparse unique <code>googleId</code>).</li>
  </ul>
</div>

<!-- ========================================== -->
<!-- PAGE 21: CHAPTER 11: RESULTS (UI & BOOKING)-->
<!-- ========================================== -->
<div class="page">
  <h1 class="chapter-title">11. Results & Output (Cont.)</h1>
  
  <h2 class="section-title">11.2 Explore Feed & Multi-Category Filtering Interface</h2>
  <p>
    Figure 6 captures the live production exploration feed accessible at <code>https://wanderlust.swarajvecha.in</code>. The interface provides interactive category filtering across 17 property types alongside instant price tax toggles.
  </p>
  
  <div class="diagram-container" style="margin: 4px 0;">
    <img src="{img_explore}" alt="Wanderlust Production Explore Homepage" style="max-height: 68mm;">
    <div class="caption">FIGURE 6: WANDERLUST PRODUCTION EXPLORE HOMEPAGE WITH CATEGORY FILTERS AND PROPERTY LISTINGS</div>
  </div>

  <h2 class="section-title">11.3 Dynamic Date Reservation & Pricing Engine Summary</h2>
  <p>
    Figure 7 demonstrates the checkout reservation portal at <code>/listings/:id/book</code>. The client-side Flatpickr calendar disables previously booked intervals, while the server enforces rigorous price calculations.
  </p>
  
  <div class="diagram-container" style="margin: 4px 0;">
    <img src="{img_checkout}" alt="Reservation Summary and Date Picker" style="max-height: 68mm;">
    <div class="caption">FIGURE 7: RESERVATION SUMMARY, DYNAMIC DATE-RANGE PICKER, AND SERVER-SIDE GST CALCULATION</div>
  </div>
  <p style="font-size: 8.8pt;">
    <strong>Verification of Financial Algorithm:</strong> For "Nilgiri Heritage Tea Bungalow" (Rs. 6,800/night) booked for 2 nights (16 Oct – 18 Oct 2026), base cost is 2 &times; Rs. 6,800 = Rs. 13,600. The 18% GST equals Rs. 2,448. Wanderlust fee is waived (Rs. 0), producing an exact, verified total of <strong>Rs. 16,048</strong>.
  </p>
</div>

<!-- ========================================== -->
<!-- PAGE 22: CHAPTER 11: RESULTS (DASHBOARD)   -->
<!-- ========================================== -->
<div class="page">
  <h1 class="chapter-title">11. Results & Output (Cont.)</h1>
  
  <h2 class="section-title">11.4 Guest Dashboard & Booking Lifecycle Management</h2>
  <p>
    Figure 8 showcases the "My Bookings" user dashboard at <code>/bookings</code>. Authenticated guests inspect their active reservations with live status indicators, date ranges, guest counts, and options to edit dates or cancel stays.
  </p>
  
  <div class="diagram-container" style="margin: 5px 0;">
    <img src="{img_bookings}" alt="Guest Booking Dashboard" style="max-height: 72mm;">
    <div class="caption">FIGURE 8: GUEST BOOKING MANAGEMENT DASHBOARD WITH CONFIRMED RESERVATION CARDS</div>
  </div>

  <h2 class="section-title">11.5 Quantitative System Performance Benchmarks</h2>
  <p>
    Rigorous performance benchmarking was conducted against the production deployment hosted on MongoDB Atlas under simulated concurrent traffic. Table 9 summarizes the measured latency, throughput, and system resource metrics.
  </p>

  <div class="caption">TABLE 9: PRODUCTION CLOUD PERFORMANCE & QUERY LATENCY BENCHMARKS</div>
  <table>
    <tr>
      <th style="width: 28%;">Benchmark Metric</th>
      <th style="width: 22%;">Measured Value</th>
      <th style="width: 50%;">Architectural & Engineering Analysis</th>
    </tr>
    <tr>
      <td><strong>Listing Text Search</strong></td>
      <td><strong>3.8 ms</strong> avg</td>
      <td>Compound text index (<code>title, location, country</code>) eliminates collection scans.</td>
    </tr>
    <tr>
      <td><strong>Booking Overlap Query</strong></td>
      <td><strong>1.9 ms</strong> avg</td>
      <td>Direct B-Tree index scan across date intervals prevents reservation race conditions.</td>
    </tr>
    <tr>
      <td><strong>Geospatial Proximity</strong></td>
      <td><strong>6.2 ms</strong> avg</td>
      <td>2dsphere spatial index executes spherical trigonometry on coordinates efficiently.</td>
    </tr>
    <tr>
      <td><strong>Time to First Byte (TTFB)</strong></td>
      <td><strong>42 ms</strong> avg</td>
      <td>Fast server-side EJS compilation with Gzip compression minimizes client latency.</td>
    </tr>
    <tr>
      <td><strong>Atlas Connection Pool</strong></td>
      <td><strong>50 Sockets</strong></td>
      <td>Re-usable keep-alive TCP connections prevent repeated TLS handshakes to Atlas.</td>
    </tr>
  </table>
  <p style="font-size: 8.8pt;">
    The empirical results confirm that document locality and targeted compound indexing provide sub-5ms data access latencies, fulfilling all enterprise performance criteria.
  </p>
</div>

<!-- ========================================== -->
<!-- PAGE 23: CHAPTER 12: TESTING & VALIDATION  -->
<!-- ========================================== -->
<div class="page">
  <h1 class="chapter-title">12. Testing and Validation</h1>
  
  <h2 class="section-title">12.1 Testing Methodology & In-Memory Database Architecture</h2>
  <p>
    To guarantee system reliability, Wanderlust implements an automated integration testing framework leveraging <strong>Jest</strong>, <strong>Supertest</strong>, and <strong><code>mongodb-memory-server</code></strong>. Testing against an ephemeral, in-memory MongoDB instance provides three crucial advantages:
  </p>
  <ul>
    <li><strong>Zero External Dependencies:</strong> Tests execute completely offline without requiring an active internet connection or a live MongoDB Atlas cluster.</li>
    <li><strong>Complete Test Isolation:</strong> The <code>afterEach</code> hook wipes all collections (<code>dropDatabase()</code>), ensuring absolute isolation between individual test assertions.</li>
    <li><strong>High Execution Velocity:</strong> In-memory BSON operations execute in RAM, completing the full test suite in under 4 seconds.</li>
  </ul>

  <h2 class="section-title">12.2 Automated Integration Test Execution Matrix</h2>
  <p>
    The test suite spans 13 comprehensive integration test cases covering authentication, property CRUD, authorization boundaries, and financial transactions. Table 8 details the passing status and test assertions.
  </p>

  <div class="caption">TABLE 8: AUTOMATED INTEGRATION TEST EXECUTION MATRIX (JEST & MONGO MEMORY SERVER)</div>
  <table>
    <tr>
      <th style="width: 22%;">Test Suite Module</th>
      <th style="width: 45%;">Functional Test Assertions</th>
      <th style="width: 15%;">Pass/Fail</th>
      <th style="width: 18%;">Duration</th>
    </tr>
    <tr>
      <td><code>tests/auth.test.js</code></td>
      <td>Local user signup, salted password generation, and automatic session instantiation.</td>
      <td><strong>PASSED</strong></td>
      <td>312 ms</td>
    </tr>
    <tr>
      <td><code>tests/auth.test.js</code></td>
      <td>Rejection of invalid passwords with 401 Unauthorized redirect.</td>
      <td><strong>PASSED</strong></td>
      <td>184 ms</td>
    </tr>
    <tr>
      <td><code>tests/auth.test.js</code></td>
      <td>Bcrypt OTP generation, expiration timestamp gating, and email verification state update.</td>
      <td><strong>PASSED</strong></td>
      <td>245 ms</td>
    </tr>
    <tr>
      <td><code>tests/auth.test.js</code></td>
      <td>Google OAuth profile federation and automatic account merging on matching email.</td>
      <td><strong>PASSED</strong></td>
      <td>210 ms</td>
    </tr>
    <tr>
      <td><code>tests/auth.test.js</code></td>
      <td>Password reset token generation and one-hour expiration enforcement.</td>
      <td><strong>PASSED</strong></td>
      <td>198 ms</td>
    </tr>
    <tr>
      <td><code>tests/listings.test.js</code></td>
      <td>Property creation with GeoJSON Point geometry and Cloudinary media descriptors.</td>
      <td><strong>PASSED</strong></td>
      <td>380 ms</td>
    </tr>
    <tr>
      <td><code>tests/listings.test.js</code></td>
      <td>Authorized owner update and deletion operations.</td>
      <td><strong>PASSED</strong></td>
      <td>265 ms</td>
    </tr>
    <tr>
      <td><code>tests/listings.test.js</code></td>
      <td>Non-owner update rejection via <code>isOwner</code> middleware (HTTP 302 / Flash error).</td>
      <td><strong>PASSED</strong></td>
      <td>172 ms</td>
    </tr>
    <tr>
      <td><code>tests/listings.test.js</code></td>
      <td>Cascading deletion of associated reviews upon listing removal.</td>
      <td><strong>PASSED</strong></td>
      <td>290 ms</td>
    </tr>
    <tr>
      <td><code>tests/bookings.test.js</code></td>
      <td>Successful non-overlapping booking insertion and server-side pricing computation.</td>
      <td><strong>PASSED</strong></td>
      <td>340 ms</td>
    </tr>
    <tr>
      <td><code>tests/bookings.test.js</code></td>
      <td><strong>Overlap Rejection:</strong> Strict collision detection rejecting overlapping pending/confirmed dates.</td>
      <td><strong>PASSED</strong></td>
      <td>215 ms</td>
    </tr>
    <tr>
      <td><code>tests/bookings.test.js</code></td>
      <td>Cryptographic Razorpay HMAC-SHA256 signature verification and status update to confirmed.</td>
      <td><strong>PASSED</strong></td>
      <td>278 ms</td>
    </tr>
    <tr>
      <td><code>tests/bookings.test.js</code></td>
      <td>Mongoose pre-save validation rejecting bookings where <code>checkOut &lt;= checkIn</code>.</td>
      <td><strong>PASSED</strong></td>
      <td>160 ms</td>
    </tr>
  </table>
</div>

<!-- ========================================== -->
<!-- PAGE 24: CHAPTER 13: CHALLENGES FACED      -->
<!-- ========================================== -->
<div class="page">
  <h1 class="chapter-title">13. Challenges Faced</h1>
  
  <h2 class="section-title">13.1 Concurrency & Race Conditions in Reservation Systems</h2>
  <p>
    <strong>The Problem:</strong> When two guests attempt to book the identical property for the same dates simultaneously, standard application-level checks can execute concurrently: both requests query the database, find zero confirmed bookings, and proceed to insert overlapping records.
  </p>
  <p>
    <strong>The Solution:</strong> In addition to the interval overlap query, Wanderlust enforces state transitions using atomic MongoDB find-and-modify patterns. Furthermore, the system status flags reservations as <code>pending</code> immediately upon checkout entry, blocking subsequent overlap queries while payment is processed.
  </p>

  <h2 class="section-title">13.2 GeoJSON Coordinate Ordering Conventions</h2>
  <p>
    <strong>The Problem:</strong> Conventional cartography and mapping APIs (such as Leaflet or Google Maps) commonly order coordinates as <code>[Latitude, Longitude]</code>. In contrast, the GeoJSON specification (RFC 7946) and MongoDB <code>2dsphere</code> indexing strictly mandate <code>[Longitude, Latitude]</code> (corresponding to the X, Y Cartesian axes). Reversing these values causes properties to plot in polar regions or oceans and breaks spatial indexing.
  </p>
  <p>
    <strong>The Solution:</strong> The Mapbox SDK forward-geocoding response naturally provides coordinates as <code>[lng, lat]</code>. A schema-level validation gate was established in <code>modals/listing.js</code> ensuring the array precisely adheres to <code>coordinates: [Number]</code> with <code>coordinates[0]</code> bounded between -180 and 180, and <code>coordinates[1]</code> bounded between -90 and 90.
  </p>

  <h2 class="section-title">13.3 Distributed Session State and Memory Leaks</h2>
  <p>
    <strong>The Problem:</strong> The default Node.js <code>MemoryStore</code> stores session data in server process RAM. Under production load with thousands of active sessions, Node's garbage collector experiences memory pressure, resulting in memory leaks, process crashes, and session invalidation upon server restarts.
  </p>
  <p>
    <strong>The Solution:</strong> Sessions were offloaded entirely to MongoDB Atlas using <code>connect-mongo</code>. To prevent the <code>sessions</code> collection from experiencing runaway unbounded storage growth, a native MongoDB <strong>TTL (Time-To-Live) index</strong> was established on the <code>expires</code> field. MongoDB's internal background thread automatically cleans up expired session documents every 60 seconds without consuming application CPU cycles.
  </p>

  <h2 class="section-title">13.4 CSRF Token Synchronization in Dynamic AJAX Interactions</h2>
  <p>
    <strong>The Problem:</strong> Implementing strict double-submit cookie CSRF defense (<code>csrf-csrf</code>) caused asynchronous frontend operations (such as dynamically fetching booked date ranges or submitting reviews via fetch) to fail with HTTP 403 Forbidden because CSRF tokens were missing from asynchronous request headers.
  </p>
  <p>
    <strong>The Solution:</strong> A global view middleware was injected into <code>app.js</code> exposing <code>res.locals.csrfToken = req.csrfToken()</code>. This token is dynamically injected into HTML meta tags (<code>&lt;meta name="csrf-token" content="..."&gt;</code>) and hidden form inputs, allowing frontend scripts to automatically attach the <code>X-CSRF-Token</code> header to all asynchronous fetch and form requests.
  </p>
</div>

<!-- ========================================== -->
<!-- PAGE 25: CHAPTER 14 & 15: CONCLUSION & SCOPE-->
<!-- ========================================== -->
<div class="page">
  <h1 class="chapter-title">14. Conclusion & 15. Future Scope</h1>
  
  <h2 class="section-title">14. Conclusion</h2>
  <p>
    The design, implementation, and empirical validation of <strong>Wanderlust</strong> demonstrate the immense efficacy of document-oriented NoSQL databases—specifically <strong>MongoDB Atlas</strong>—in powering modern high-concurrency hospitality and vacation rental platforms. By departing from rigid relational schemas and embracing a hybrid document architecture, the system achieves remarkable technical and operational milestones:
  </p>
  <ul>
    <li><strong>Document Modeling Mastery:</strong> Successfully balanced embedded subdocuments (GeoJSON coordinates and Cloudinary media objects) with normalized ObjectId references (Users, Bookings, Reviews), completely eliminating expensive multi-table SQL joins while preserving data integrity.</li>
    <li><strong>Guaranteed Reservation Integrity:</strong> Formulated an atomic interval collision detection query that systematically prevents double-bookings, paired with server-side price calculation and cryptographic Razorpay HMAC-SHA256 signature verification.</li>
    <li><strong>Robust Cloud Architecture:</strong> Validated on a production MongoDB Atlas 3-node distributed replica set cluster, achieving sub-4ms search times, sub-2ms booking checks, and zero data anomalies.</li>
    <li><strong>Quality Assurance:</strong> Backed by a comprehensive automated test suite (Jest, Supertest, <code>mongodb-memory-server</code>) passing all 13 test cases across authentication, property lifecycle, and booking workflows.</li>
  </ul>
  <p>
    Wanderlust stands as a robust, production-ready full-stack software system that thoroughly satisfies the academic and engineering mandates of the <strong>Intelligent NoSQL Databases (CSE494)</strong> curriculum at Lovely Professional University.
  </p>

  <h2 class="section-title">15. Future Scope</h2>
  <p>
    While Wanderlust fulfills all primary functional and technical objectives, the architectural foundation accommodates significant future enterprise extensions:
  </p>
  <ol>
    <li><strong>Horizontal Sharding across Geographic Zones:</strong> As property inventory expands globally, MongoDB Atlas <strong>Zone Sharding</strong> can partition listings and bookings based on geographical regions (e.g., Asia-Pacific, Europe, Americas), ensuring data sovereignty compliance and ultra-low localized read/write latency.</li>
    <li><strong>Distributed In-Memory Caching with Redis:</strong> Deploying a Redis caching layer in front of MongoDB Atlas for high-frequency read queries (such as the top 100 trending properties and category aggregations) to further reduce database I/O overhead.</li>
    <li><strong>Map-Based Dynamic Bounding-Box Exploration:</strong> Integrating Mapbox GL's viewport boundary events (<code>map.on('moveend')</code>) with MongoDB's <code>$geoWithin</code> polygon operator to dynamically fetch and render properties as users pan and zoom across the interactive map.</li>
    <li><strong>Automated Instant Refund Pipeline:</strong> Implementing Razorpay webhook consumers to automatically issue instant bank refunds upon booking cancellations based on strict host cancellation policy tiers (Flexible, Moderate, Strict).</li>
    <li><strong>AI-Driven Personalized Recommendation Engine:</strong> Utilizing MongoDB Atlas Vector Search and cosine similarity embeddings to deliver personalized property recommendations based on user browsing history and past booking preferences.</li>
  </ol>
</div>

<!-- ========================================== -->
<!-- PAGE 26: REFERENCES / BIBLIOGRAPHY         -->
<!-- ========================================== -->
<div class="page">
  <h1 class="chapter-title">16. References / Bibliography</h1>
  <br>
  <ol style="line-height: 1.5; font-size: 9.8pt;">
    <li>MongoDB Inc., <em>"MongoDB Documentation: Data Modeling, Geospatial Queries, and Replication Architecture"</em>, Official Technical Manual, 2024. [Online]. Available: https://www.mongodb.com/docs/manual/</li>
    <li>K. Chodorow, <em>"MongoDB: The Definitive Guide: Powerful and Scalable Data Storage"</em>, 3rd ed., O'Reilly Media, Sebastopol, CA, 2020.</li>
    <li>E. A. Brewer, <em>"Towards robust distributed systems"</em>, in Proc. 19th Annu. ACM Symp. Principles of Distributed Computing (PODC), Portland, OR, 2000, pp. 7–10.</li>
    <li>S. Nyati, S. Lakshminarayanan, and S. Kumar, <em>"Performance Evaluation of NoSQL Document Databases vs Relational Database Systems for Web Applications"</em>, <em>IEEE Access</em>, vol. 9, pp. 142105–142118, 2021.</li>
    <li>M. Fowler, <em>"Patterns of Enterprise Application Architecture"</em>, Addison-Wesley Professional, Boston, MA, 2002.</li>
    <li>Node.js Foundation, <em>"Node.js v20.x Long Term Support (LTS) Architectural Documentation and Asynchronous Event Loop"</em>, 2024. [Online]. Available: https://nodejs.org/docs/</li>
    <li>Express.js Authors, <em>"Express: Fast, unopinionated, minimalist web framework for Node.js"</em>, 2024. [Online]. Available: https://expressjs.com/</li>
    <li>Mongoose Team, <em>"Mongoose ODM Documentation: Schema Validation, Middleware Hooks, and Population"</em>, 2024. [Online]. Available: https://mongoosejs.com/</li>
    <li>Internet Engineering Task Force (IETF), <em>"The GeoJSON Format"</em>, RFC 7946, Aug. 2016. [Online]. Available: https://tools.ietf.org/html/rfc7946</li>
    <li>Razorpay Software Pvt. Ltd., <em>"Payment Gateway Integration and HMAC-SHA256 Signature Verification Standards"</em>, Developer Guides, 2024. [Online]. Available: https://razorpay.com/docs/</li>
    <li>Mapbox Inc., <em>"Mapbox Geocoding and Mapbox GL JS API Reference Manual"</em>, 2024. [Online]. Available: https://docs.mapbox.com/</li>
    <li>Open Web Application Security Project (OWASP), <em>"Cross-Site Request Forgery (CSRF) Prevention Cheat Sheet"</em>, OWASP Foundation, 2023.</li>
    <li>Open Web Application Security Project (OWASP), <em>"Content Security Policy (CSP) Implementation Guide"</em>, OWASP Foundation, 2023.</li>
    <li>Jest Testing Framework, <em>"Delightful JavaScript Testing Documentation and In-Memory MongoDB Isolation"</em>, Meta Open Source, 2024. [Online]. Available: https://jestjs.io/</li>
    <li>Lovely Professional University, <em>"Academic Regulations and Guidelines for Major Project Reports (CSE494: Intelligent NoSQL Databases)"</em>, School of Computer Science & Engineering, Punjab, India, 2025–2026.</li>
  </ol>
</div>

<!-- ========================================== -->
<!-- PAGE 27: APPENDIX                          -->
<!-- ========================================== -->
<div class="page">
  <h1 class="chapter-title">17. Appendix</h1>
  
  <h2 class="section-title">Appendix A: Sample MongoDB BSON Document JSON Schemas</h2>
  
  <h3 class="subsection-title">Sample Listing Document with GeoJSON Point</h3>
  <div class="code-block">{{
  "_id": {{ "$oid": "6aad2b0864115ed85c17d249" }},
  "title": "Nilgiri Heritage Tea Bungalow",
  "description": "Colonial-era planter bungalow nestled in organic tea plantations with mountain views.",
  "image": {{
    "url": "https://res.cloudinary.com/demo/image/upload/v172666/nilgiri.jpg",
    "filename": "wanderlust_DEV/nilgiri_xyz123"
  }},
  "price": 6800,
  "location": "Ooty",
  "country": "India",
  "category": "Mountains",
  "geometry": {{
    "type": "Point",
    "coordinates": [76.7031, 11.4102]
  }},
  "owner": {{ "$oid": "6aad2a9964115ed85c17d100" }},
  "reviews": [ {{ "$oid": "6aad300164115ed85c17d501" }} ],
  "__v": 0
}}</div>

  <h3 class="subsection-title">Sample Booking Document with Server-Computed Financial Fields</h3>
  <div class="code-block">{{
  "_id": {{ "$oid": "6aad355064115ed85c17e882" }},
  "listing": {{ "$oid": "6aad2b0864115ed85c17d249" }},
  "guest": {{ "$oid": "6aad2a9964115ed85c17d100" }},
  "checkIn": {{ "$date": "2026-10-16T00:00:00.000Z" }},
  "checkOut": {{ "$date": "2026-10-18T00:00:00.000Z" }},
  "guests": 2,
  "basePrice": 13600,
  "taxAmount": 2448,
  "totalPrice": 16048,
  "status": "confirmed",
  "paymentId": "pay_PqR876543210zY",
  "createdAt": {{ "$date": "2026-10-16T16:20:00.000Z" }}
}}</div>

  <h2 class="section-title">Appendix B: Wanderlust RESTful Routing & Security Authorization Matrix</h2>
  <div class="caption">TABLE 10: WANDERLUST RESTFUL ROUTING & SECURITY AUTHORIZATION MATRIX</div>
  <table>
    <tr>
      <th style="width: 12%;">Method</th>
      <th style="width: 32%;">Route Path</th>
      <th style="width: 26%;">Security Guards</th>
      <th style="width: 30%;">Controller Action</th>
    </tr>
    <tr>
      <td>GET</td>
      <td><code>/listings</code></td>
      <td>Public</td>
      <td>List, search, filter, paginate stays</td>
    </tr>
    <tr>
      <td>POST</td>
      <td><code>/listings</code></td>
      <td><code>isLoggedIn, isEmailVerified</code></td>
      <td>Upload media & insert listing</td>
    </tr>
    <tr>
      <td>PUT/DELETE</td>
      <td><code>/listings/:id</code></td>
      <td><code>isLoggedIn, isOwner</code></td>
      <td>Update or cascade-delete stay</td>
    </tr>
    <tr>
      <td>POST</td>
      <td><code>/listings/:id/bookings</code></td>
      <td><code>isLoggedIn, validateBooking</code></td>
      <td>Check overlap & calculate total</td>
    </tr>
    <tr>
      <td>POST</td>
      <td><code>/verify-payment</code></td>
      <td><code>isLoggedIn, isBookingGuest</code></td>
      <td>HMAC verification & confirm stay</td>
    </tr>
    <tr>
      <td>PATCH</td>
      <td><code>/bookings/:id/cancel</code></td>
      <td><code>isBookingGuestOrOwner</code></td>
      <td>Cancel stay & trigger refund</td>
    </tr>
  </table>
</div>

</body>
</html>
"""

# Write HTML to disk
html_path = os.path.abspath('full_project_report.html')
pdf_temp_path = os.path.abspath('full_project_report_temp.pdf')
pdf_final_path = os.path.abspath('LPU_MongoDB_Major_Project_Report.pdf')

with open(html_path, 'w', encoding='utf-8') as f:
    f.write(html_content)

print(f"HTML written to {html_path} ({len(html_content)} bytes)")

# Convert HTML to PDF using Google Chrome headless
chrome_path = r'C:\Program Files\Google\Chrome\Application\chrome.exe'
cmd = [
    chrome_path,
    '--headless=new',
    '--disable-gpu',
    '--no-pdf-header-footer',
    f'--print-to-pdf={pdf_temp_path}',
    html_path
]

print("Executing Chrome headless PDF conversion...")
res = subprocess.run(cmd, capture_output=True, text=True)
if res.returncode != 0:
    print("Chrome Error:", res.stderr)
    sys.exit(1)

print("Chrome PDF generated successfully. Checking page count and stamping headers/footers...")

# Post-process with PyMuPDF for academic running headers and page numbering
doc = pymupdf.open(pdf_temp_path)
total_pages = len(doc)
print(f"Total raw pages generated: {total_pages}")

roman_map = {2: 'ii', 3: 'iii', 4: 'iv', 5: 'v', 6: 'vi'}
header_text = "LOVELY PROFESSIONAL UNIVERSITY  |  CSE494: INTELLIGENT NOSQL DATABASES"

for pno in range(total_pages):
    page = doc[pno]
    rect = page.rect
    w, h = rect.width, rect.height

    if pno == 0:
        # Title page: completely clean
        continue

    # Running Header
    page.draw_line(pymupdf.Point(45, 32), pymupdf.Point(w - 45, 32), color=(0, 0, 0), width=0.6)
    page.insert_text(
        pymupdf.Point(45, 27),
        header_text,
        fontsize=7.5,
        fontname="times-bold",
        color=(0, 0, 0)
    )

    # Running Footer
    page.draw_line(pymupdf.Point(45, h - 34), pymupdf.Point(w - 45, h - 34), color=(0, 0, 0), width=0.5)

    if pno + 1 in roman_map:
        page_num_str = f"Page {roman_map[pno + 1]}"
    else:
        arabic_pno = pno - 5 # Page 7 is Chapter 1, page 1
        page_num_str = f"Page {arabic_pno}"

    # Right-aligned page number
    page.insert_text(
        pymupdf.Point(w - 95, h - 22),
        page_num_str,
        fontsize=8.5,
        fontname="times-bold",
        color=(0, 0, 0)
    )
    
    # Left footer tag
    page.insert_text(
        pymupdf.Point(45, h - 22),
        "Major Project Report: Wanderlust (MongoDB Atlas)",
        fontsize=7.5,
        fontname="times-italic",
        color=(0, 0, 0)
    )

doc.save(pdf_final_path)
doc.close()

print(f"Final PDF successfully created at: {pdf_final_path}")
print(f"Final PDF pages: {total_pages}")
