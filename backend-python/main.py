from fastapi import FastAPI, HTTPException, Depends, Query, Path, status, Request
from fastapi.responses import HTMLResponse, RedirectResponse, JSONResponse
import uvicorn
from fastapi.middleware.cors import CORSMiddleware
from fastapi.openapi.docs import get_swagger_ui_html
from fastapi.openapi.utils import get_openapi
from typing import List, Optional, Dict, Any
from datetime import datetime
import os
import sqlalchemy
from sqlalchemy.sql import func

# Import database
from database import get_db, engine, Base
from sqlalchemy.orm import Session

# Import security utilities
from auth.security import get_current_active_user, verify_api_key, API_KEY

# Import routers
from users.router import router as users_router
from policies.router import router as policies_router
from claims.router import router as claims_router
from riskpool.router import router as riskpool_router
from auth.router import router as auth_router

# Import models for system status
from policies.models import Policy, PolicyStatus
from claims.models import Claim, ClaimStatus
from riskpool.models import RiskPoolMetrics, Deposit

# Initialize FastAPI with custom branding but override default docs
app = FastAPI(
    title="FreelanceShield API",
    description="Insurance and protection services for freelancers",
    version="1.0.0",
    # Override default docs to use custom version below
    docs_url=None,
    redoc_url="/api-reference"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://freelanceshield.xyz",
        "https://app.freelanceshield.xyz",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
        "http://localhost:8080", 
        "http://127.0.0.1:8080",
        "http://demo.freelanceshield.xyz",
        "https://demo.freelanceshield.xyz",
        "http://api.freelanceshield.xyz",
        "https://api.freelanceshield.xyz"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Custom OpenAPI schema with branding
def custom_openapi():
    if app.openapi_schema:
        return app.openapi_schema
        
    openapi_schema = get_openapi(
        title="FreelanceShield API",
        version="1.0.0",
        description="""<div style="display: flex; align-items: center; margin-bottom: 20px;">
            <svg width="60" height="60" viewBox="0 0 24 24" fill="#6a37a4" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/>
            </svg>
            <h1 style="margin-left: 15px; color: #6a37a4;">FreelanceShield API</h1>
        </div>
        <p>Insurance and protection services API for freelancers.</p>
        <p><a href="https://freelanceshield.xyz">Visit our website</a> | <a href="https://app.freelanceshield.xyz">Dashboard</a></p>""",
        routes=app.routes,
    )
    
    app.openapi_schema = openapi_schema
    return app.openapi_schema

app.openapi = custom_openapi

# Custom Swagger UI with FreelanceShield branding
@app.get("/docs", include_in_schema=False)
async def custom_swagger_ui_html():
    return get_swagger_ui_html(
        openapi_url=app.openapi_url,
        title=app.title + " - Documentation",
        oauth2_redirect_url=app.swagger_ui_oauth2_redirect_url,
        swagger_js_url="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-bundle.js",
        swagger_css_url="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui.css",
        swagger_favicon_url="https://freelanceshield.xyz/favicon.ico",
        custom_css="""
        :root {
            --primary: #6a37a4; 
            --primary-light: #8d5cc2;
            --primary-dark: #4f2683;
            --secondary: #8053c0;
            --accent: #9475d1;
            --bg-light: #f6f4fb;
        }
        
        .topbar {
            background-color: var(--primary) !important;
        }
        
        .swagger-ui .opblock .opblock-summary-method {
            background-color: var(--primary) !important;
        }
        
        .swagger-ui .btn.execute {
            background-color: var(--primary) !important;
            color: white !important;
            border-color: var(--primary-dark) !important;
        }
        
        .swagger-ui .btn.authorize {
            background-color: var(--secondary) !important;
            color: white !important;
            border-color: var(--primary) !important;
        }
        
        .swagger-ui .opblock.opblock-post {
            border-color: var(--primary) !important;
            background: rgba(106, 55, 164, 0.1) !important;
        }
        
        .swagger-ui .opblock.opblock-post .opblock-summary {
            border-color: var(--primary) !important;
        }
        
        .swagger-ui .opblock.opblock-get {
            border-color: var(--accent) !important;
            background: rgba(148, 117, 209, 0.1) !important;
        }
        
        .swagger-ui .opblock.opblock-get .opblock-summary {
            border-color: var(--accent) !important;
        }
        
        .swagger-ui .info .title {
            color: var(--primary) !important;
        }
        
        .swagger-ui .scheme-container {
            background-color: var(--bg-light) !important;
        }
        """
    )

@app.get("/", response_class=HTMLResponse)
def read_root(request: Request):
    """Welcome page for FreelanceShield API"""
    base_url = str(request.base_url)
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <title>FreelanceShield API</title>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap" rel="stylesheet">
        <style>
            :root {{
                --primary: #6a37a4; 
                --primary-light: #8d5cc2;
                --primary-dark: #4f2683;
                --secondary: #8053c0;
                --accent: #9475d1; 
                --text-light: #ffffff;
                --text-dark: #333333;
                --bg-light: #f6f4fb;
                --bg-card: #ffffff;
            }}
            
            body {{ 
                font-family: 'Poppins', sans-serif;
                max-width: 800px; 
                margin: 0 auto; 
                padding: 20px; 
                line-height: 1.5;
                color: var(--text-dark);
                background-color: var(--bg-light);
            }}
            h1 {{ color: var(--primary); font-weight: 600; }}
            h2 {{ color: var(--secondary); margin-top: 30px; font-weight: 600; }}
            .card {{ 
                background-color: var(--bg-card); 
                border-radius: 12px; 
                padding: 30px; 
                margin: 20px 0;
                box-shadow: 0 4px 12px rgba(106, 55, 164, 0.15);
            }}
            .button-container {{ display: flex; gap: 15px; margin: 25px 0; }}
            .button {{ 
                background-color: var(--primary); 
                color: white; 
                padding: 12px 20px; 
                border-radius: 8px; 
                text-decoration: none;
                font-weight: 500;
                transition: all 0.2s ease;
                display: inline-flex;
                align-items: center;
            }}
            .button svg {{
                margin-right: 8px;
            }}
            .button:hover {{ 
                background-color: var(--primary-dark); 
                transform: translateY(-2px);
                box-shadow: 0 4px 8px rgba(106, 55, 164, 0.2);
            }}
            .api-feature {{
                display: flex;
                align-items: flex-start;
                margin-bottom: 15px;
                padding: 15px;
                background-color: rgba(106, 55, 164, 0.05);
                border-radius: 8px;
            }}
            .feature-icon {{
                margin-right: 15px;
                color: var(--primary);
            }}
            .feature-text {{
                flex: 1;
            }}
            .feature-text h3 {{
                margin-top: 0;
                color: var(--primary);
            }}
        </style>
    </head>
    <body>
        <header>
            <div style="display: flex; align-items: center;">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="#6a37a4" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/>
                </svg>
                <h1 style="margin-left: 15px;">FreelanceShield API</h1>
            </div>
        </header>
        
        <div class="card">
            <p>Welcome to the FreelanceShield API service. This API provides a complete implementation of the FreelanceShield insurance platform for freelancers.</p>
            
            <div class="api-feature">
                <div class="feature-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 16 16">
                        <path d="M8 1a2.5 2.5 0 0 1 2.5 2.5V4h-5v-.5A2.5 2.5 0 0 1 8 1zm3.5 3v-.5a3.5 3.5 0 1 0-7 0V4H1v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V4h-3.5z"/>
                    </svg>
                </div>
                <div class="feature-text">
                    <h3>Insurance Policies</h3>
                    <p>Create and manage insurance policies designed specifically for freelancers and their unique needs.</p>
                </div>
            </div>
            
            <div class="api-feature">
                <div class="feature-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 16 16">
                        <path d="M2.5 15a.5.5 0 1 1 0-1h1v-1a4.5 4.5 0 0 1 2.557-4.06c.29-.139.443-.377.443-.59v-.7c0-.213-.154-.451-.443-.59A4.5 4.5 0 0 1 3.5 3V2h-1a.5.5 0 0 1 0-1h11a.5.5 0 0 1 0 1h-1v1a4.5 4.5 0 0 1-2.557 4.06c-.29.139-.443.377-.443.59v.7c0 .213.154.451.443.59A4.5 4.5 0 0 1 12.5 13v1h1a.5.5 0 0 1 0 1h-11zm2-13v1c0 .537.12 1.045.337 1.5h6.326c.216-.455.337-.963.337-1.5V2h-7zm3 6.35c0 .701-.478 1.236-1.011 1.492A3.5 3.5 0 0 0 4.5 13s.866-1.299 3-1.48V8.35zm1 0v3.17c2.134.181 3 1.48 3 1.48a3.5 3.5 0 0 0-1.989-3.158C8.978 9.586 8.5 9.052 8.5 8.351z"/>
                    </svg>
                </div>
                <div class="feature-text">
                    <h3>Claims Processing</h3>
                    <p>Submit and process insurance claims with efficient verification and resolution workflows.</p>
                </div>
            </div>
            
            <div class="api-feature">
                <div class="feature-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 16 16">
                        <path d="M1 3a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1H1zm7 8a2 2 0 1 0 0-4 2 2 0 0 0 0 4z"/>
                        <path d="M0 5a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H1a1 1 0 0 1-1-1V5zm3 0a2 2 0 0 1-2 2v4a2 2 0 0 1 2 2h10a2 2 0 0 1 2-2V7a2 2 0 0 1-2-2H3z"/>
                    </svg>
                </div>
                <div class="feature-text">
                    <h3>Risk Pool Management</h3>
                    <p>Comprehensive risk pool health monitoring and capital management.</p>
                </div>
            </div>
            
            <div class="button-container">
                <a href="{base_url}docs" class="button">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                        <path d="M5.5 7a.5.5 0 0 0 0 1h5a.5.5 0 0 0 0-1h-5zM5 9.5a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 0 1h-5a.5.5 0 0 1-.5-.5zm0 2a.5.5 0 0 1 .5-.5h2a.5.5 0 0 1 0 1h-2a.5.5 0 0 1-.5-.5z"/>
                        <path d="M9.5 0H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V4.5L9.5 0zm0 1v2A1.5 1.5 0 0 0 11 4.5h2V14a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1h5.5z"/>
                    </svg>
                    Interactive API Documentation
                </a>
                <a href="{base_url}api-reference" class="button">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                        <path d="M14 1a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1h12zM2 0a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2H2z"/>
                        <path d="m8.93 6.588-2.29.287-.082.38.45.083c.294.07.352.176.288.469l-.738 3.468c-.194.897.105 1.319.808 1.319.545 0 1.178-.252 1.465-.598l.088-.416c-.2.176-.492.246-.686.246-.275 0-.375-.193-.304-.533L8.93 6.588zM9 4.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0z"/>
                    </svg>
                    API Reference
                </a>
            </div>
        </div>
        
        <h2>Core Modules</h2>
        <div class="card">
            <div class="module"><strong>👤 Users</strong>: User profiles and authentication</div>
            <div class="module"><strong>📜 Policies</strong>: Insurance policy management</div>
            <div class="module"><strong>🔖 Claims</strong>: Claim filing and processing</div>
            <div class="module"><strong>💰 Risk Pool</strong>: Capital management</div>
            <div class="module"><strong>⚙️ System</strong>: Admin controls and monitoring</div>
            <p>All endpoints implement proper validation, error handling, and follow RESTful principles.</p>
        </div>
        
        <h2>System Status</h2>
        <div class="card">
            <p>For the current system status, visit:</p>
            <pre><code>GET {base_url}system/status</code></pre>
        </div>
    </body>
    </html>
    """
    return HTMLResponse(content=html_content)

@app.get("/api", response_class=JSONResponse)
async def api_info():
    """Public API information endpoint - no authentication required"""
    return {
        "name": "FreelanceShield API",
        "version": "1.0.0",
        "description": "Insurance platform for freelancers and clients",
        "endpoints": {
            "documentation": "/docs",
            "redoc": "/redoc",
            "public_info": "/api"
        },
        "authentication": {
            "type": "API Key",
            "header": "X-API-Key",
            "demo_key": DEMO_API_KEY,  # Only expose demo key in development!
            "request_access": "mailto:info@freelanceshield.xyz"
        }
    }

# Initialize database tables
@app.on_event("startup")
async def startup_db_client():
    # Create all tables in the database
    # Comment this out if using Alembic for migrations
    Base.metadata.create_all(bind=engine)
    
    # Initialize upload directories
    os.makedirs("./uploads/evidence", exist_ok=True)

# Include routers
app.include_router(auth_router)
app.include_router(users_router)
app.include_router(policies_router)
app.include_router(claims_router)
app.include_router(riskpool_router)

# Add custom system status endpoint
@app.get("/system/status", tags=["system"])
async def system_status(db: Session = Depends(get_db), current_user = Depends(get_current_active_user)):
    """Get current system status and statistics"""
    
    # Count policies by status
    policy_counts = db.query(
        PolicyStatus, func.count(Policy.id)
    ).group_by(Policy.status).all()
    
    policy_stats = {
        "total": db.query(func.count(Policy.id)).scalar() or 0,
        "active": db.query(func.count(Policy.id)).filter(Policy.status == PolicyStatus.ACTIVE).scalar() or 0,
        "by_status": {status.value: count for status, count in policy_counts}
    }
    
    # Count claims by status
    claim_counts = db.query(
        ClaimStatus, func.count(Claim.id)
    ).group_by(Claim.status).all()
    
    claim_stats = {
        "total": db.query(func.count(Claim.id)).scalar() or 0,
        "pending": db.query(func.count(Claim.id)).filter(
            Claim.status.in_([ClaimStatus.PENDING, ClaimStatus.UNDER_REVIEW])
        ).scalar() or 0,
        "by_status": {status.value: count for status, count in claim_counts}
    }
    
    # Get risk pool metrics
    metrics = db.query(RiskPoolMetrics).order_by(
        RiskPoolMetrics.snapshot_date.desc()
    ).first()
    
    if not metrics:
        metrics = RiskPoolMetrics()
    
    risk_pool = {
        "reserve_ratio": metrics.reserve_ratio,
        "total_capital": metrics.total_capital,
        "total_coverage_liability": metrics.total_coverage_liability,
        "last_update": metrics.last_update_time.isoformat() if metrics.last_update_time else None,
        "active_policies_count": metrics.active_policies_count,
        "risk_score": metrics.risk_score
    }
    
    return {
        "system_name": "FreelanceShield API",
        "version": "1.0.0",
        "database": {
            "connected": True,
            "type": engine.dialect.name
        },
        "policies": policy_stats,
        "claims": claim_stats,
        "risk_pool": risk_pool
    }

# Root endpoint - Welcome page
@app.get("/", response_class=HTMLResponse)
async def welcome_page(request: Request):
    """Welcome page for FreelanceShield API"""
    html_content = """
    <!DOCTYPE html>
    <html>
    <head>
        <title>FreelanceShield API</title>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                margin: 0;
                padding: 0;
                color: #333;
                background-color: #f7f7f7;
                line-height: 1.6;
            }
            .container {
                max-width: 800px;
                margin: 0 auto;
                padding: 40px 20px;
            }
            .header {
                text-align: center;
                margin-bottom: 40px;
            }
            .logo {
                width: 100px;
                height: 100px;
                margin-bottom: 20px;
            }
            h1 {
                color: #6a37a4;
                margin: 0;
                font-size: 2.5em;
            }
            h2 {
                color: #8053c0;
                border-bottom: 2px solid #e3e3e3;
                padding-bottom: 10px;
                margin: 30px 0 15px;
            }
            .card {
                background: white;
                border-radius: 8px;
                padding: 20px;
                margin-bottom: 20px;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            .button {
                display: inline-block;
                background-color: #6a37a4;
                color: white;
                padding: 12px 24px;
                text-decoration: none;
                border-radius: 4px;
                font-weight: bold;
                margin: 10px 5px;
                transition: background-color 0.3s;
            }
            .button:hover {
                background-color: #4f2683;
            }
            .endpoint-list {
                list-style-type: none;
                padding: 0;
            }
            .endpoint-list li {
                padding: 10px 0;
                border-bottom: 1px solid #eee;
            }
            .footer {
                text-align: center;
                margin-top: 40px;
                color: #777;
                font-size: 0.9em;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <svg class="logo" viewBox="0 0 24 24" fill="#6a37a4" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/>
                </svg>
                <h1>FreelanceShield API</h1>
                <p>Insurance and protection services for freelancers</p>
            </div>

            <div class="card">
                <h2>API Documentation</h2>
                <p>Welcome to the FreelanceShield API. This API provides endpoints for users, policies, claims, and risk pool management.</p>
                <div>
                    <a href="/docs" class="button">API Documentation</a>
                    <a href="/api-reference" class="button">API Reference</a>
                    <a href="/system/status" class="button">System Status</a>
                </div>
            </div>

            <div class="card">
                <h2>Available Endpoints</h2>
                <ul class="endpoint-list">
                    <li><strong>Authentication:</strong> /auth/token - Login and get access token</li>
                    <li><strong>Users:</strong> /users - User management endpoints</li>
                    <li><strong>Policies:</strong> /policies - Insurance policy management</li>
                    <li><strong>Claims:</strong> /claims - Claims processing and evidence</li>
                    <li><strong>Risk Pool:</strong> /riskpool - Capital pool management</li>
                    <li><strong>System:</strong> /system/status - API status and metrics</li>
                </ul>
            </div>

            <div class="footer">
                <p>&copy; 2025 FreelanceShield. All rights reserved.</p>
                <p>
                    <a href="https://freelanceshield.xyz">Main Website</a> | 
                    <a href="https://app.freelanceshield.xyz">Dashboard</a> | 
                    <a href="https://api.freelanceshield.xyz">API</a>
                </p>
            </div>
        </div>
    </body>
    </html>
    """
    return HTMLResponse(content=html_content)

@app.get("/api-info", tags=["system"])
async def api_info():
    """Public API information endpoint - no authentication required"""
    return {
        "name": "FreelanceShield API",
        "version": "1.0.0",
        "description": "Insurance and protection services API for freelancers",
        "endpoints": [
            "/auth/token",
            "/users",
            "/policies", 
            "/claims",
            "/riskpool",
            "/system/status"
        ],
        "documentation_url": "/docs",
        "main_website": "https://freelanceshield.xyz",
        "dashboard_url": "https://app.freelanceshield.xyz"
    }
