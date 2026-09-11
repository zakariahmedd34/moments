import uvicorn


if __name__ == "__main__":
    #dir.file.var, 0.0.0.0 run on any availble domain / local address - private IP address
    uvicorn.run("src.app:app", host="0.0.0.0",port=8000,reload=True)
    