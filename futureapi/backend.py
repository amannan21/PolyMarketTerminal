

# # here we will have an api endpoint that takes in the topic information and returns the summary
# # we will use the openai api to generate the summary
# # we will use the fastapi framework to create the api
# # we will use the uvicorn server to run the api
# # we will use the latest version of the openai api
# # we will use the latest version of the fastapi framework
# # we will use the latest version of the uvicorn server
# import fastapi
# import univorn 
# import openai
# from pydantic import BaseModel

# app = fastapi.FastAPI()
# # set openai api key
# openai.api_key = os.getenv("OPENAI_API_KEY")


# class SummarizeRequest(BaseModel):
#     topic: str
#     description: str
#     date: str
#     time: str
#     location: str
#     organizer: str


# @app.get("/")
# def health_check():
#     return {"status": "ok"} # this is a python dictionary that is returned as a json object automatically by fastapi 


# @app.post("/summarize")
# def summarize(request: SummarizeRequest):
#     # take the request and pass it to the openai api


# if __name__ = "__main__":
#     print("Starting the univorn server...")
#     uvicorn.run(app, host="0.0.0.0", port=8000)