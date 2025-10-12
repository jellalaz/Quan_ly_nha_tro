if __name__ == "__main__":
    import uvicorn
    import sys
    import os
    
    # Thêm thư mục backend vào Python path
    sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
    
    from app.main import app
    uvicorn.run(app, host="0.0.0.0", port=8000)