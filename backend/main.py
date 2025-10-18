
if __name__ == "__main__":
    import uvicorn
    import sys
    import os
    
    # Ngăn tạo file __pycache__ toàn cục (bao gồm cả uvicorn reload)
    os.environ["PYTHONDONTWRITEBYTECODE"] = "1"
    sys.dont_write_bytecode = True
    # Thêm thư mục backend vào Python path
    sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
    
    # from app.main import app
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)