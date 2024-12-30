import json
import streamlit as st
import google.generativeai as genai
import os
from dotenv import load_dotenv
import copy
import time

load_dotenv()
min_questions_per_topic=2
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

st.set_page_config(
    page_title="English tutor"
)
# Define topics
topics = [
    "Present Tense",
    "Past Tense",
    "Future Tense"
    "Prepositions",
    "Adverbs",
    "Conjunctions"
]

model = genai.GenerativeModel(
        model_name="gemini-2.0-flash-exp",
        generation_config={
            "temperature": 1,
            "top_p": 0.95,
            "top_k": 40,
            "max_output_tokens": 8192,
            "response_mime_type": "application/json",
        }
    )

def initialize_session_state():
    if "data" not in st.session_state:
        st.session_state.data = {
            "current_topic":topics[0],
            "question_count":0,
            "asked_questions":set(),
            "current_question":None,
            "current_answer":None,
            "correct_answers":0
        }

def get_copy_of_session():
    data = copy.deepcopy(st.session_state.data)
    return data

def generate_dynamic_question(topic,asked_questions):
    prompt = f"Generate a question about {topic} in English with a correct answer."
    chat_session = model.start_chat(
        history=[
            {
                "role": "user",
                "parts": [
                    f"Generate a question about {topic} with the answer for beginner. "
                    f"Question must not be in the list {asked_questions}"
                    f"questions must be fill in the blanks"
                    f"answer should n't be a topic {topic} for question"
                ]
            },
        ]
    )
    response = chat_session.send_message(prompt)

    return parse_response(response)

def check_answer(question,answer):

        prompt = f"check the answer: '{answer}' is correct or not for question: '{question}'"
        chat_session = model.start_chat(
            history=[
                {
                    "role": "user",
                    "parts": [
                        f"check the answer {answer} is correct or not for question {question}"
                        f"response should be like 'isCorrect':0. 0 for wrong 1 for correct"
                    ]
                },
            ]
        )
        print(prompt)
        response = chat_session.send_message(prompt)
        if not response.text:
            raise ValueError("The response text is empty!")

        candidate_content = response.candidates[0].content.parts[0].text
        correct_answer = json.loads(candidate_content)
        is_correct = correct_answer.get("isCorrect", "Sorry, I couldn't generate a question.")
        print('is_correct',is_correct)
        return bool(is_correct)

def parse_response(response):
    try:
        if not response.text:
            raise ValueError("The response text is empty!")

        candidate_content = response.candidates[0].content.parts[0].text
        question_answer = json.loads(candidate_content)

        question = question_answer.get("question", "Sorry, I couldn't generate a question.")
        answer = question_answer.get("answer", "Sorry, I couldn't provide an answer.")

        return question, answer

    except (json.JSONDecodeError, IndexError, AttributeError, ValueError) as e:
        print(f"Error: {e}")
        return "Sorry, I couldn't generate a question at this time.", None

def next_topic():
    data = get_copy_of_session()
    current_index = topics.index(data['current_topic'])
    if current_index + 1 < len(topics):
        data['current_topic'] = topics[current_index + 1]
    else:
        data['current_topic'] = topics[0]  # Loop back to the first topic if all topics are completed
    st.session_state.data = data

def display_question_and_handle_answer():
    data = get_copy_of_session()
    st.write(f"**Current Topic:** {data['current_topic']}")

    if data['current_question']:
        st.write(f"**Question {data['question_count'] + 1}:** {data['current_question']}")
        user_answer = st.text_input(f"Your Answer (Question {data['question_count'] + 1}):", key="user_answer")

        if st.button("Submit Answer", key="submit_button"):
            if check_answer(data['current_question'], user_answer.strip().lower()):
                data["correct_answers"] += 1
                st.success("Correct! 🎉 Great job!")
            else:
                st.error(f"Wrong! The correct answer is: {data['current_answer']}")

            asked_questions = data['asked_questions']
            asked_questions.add(data['current_question'])
            data["asked_questions"] = asked_questions
            data['question_count'] += 1
            data['current_question'] = None

            st.session_state.data = data
            if data['question_count'] == min_questions_per_topic:
                data['question_count'] = 0
                st.session_state.data = data
                next_topic()
            time.sleep(0.5)
            st.rerun()
    print(data)
    st.write(f"Total questions answered: {data['correct_answers']}/{len(data['asked_questions'])}")

def main():
    initialize_session_state()
    data = get_copy_of_session()

    if data['question_count'] < min_questions_per_topic and data['current_question'] is None:
        question, answer = generate_dynamic_question(data['current_topic'],data['asked_questions'])
        while question in data['asked_questions']:
            question, answer = generate_dynamic_question(data['current_topic'])
        data ={
            **data,
            "current_question":question,
            "current_answer":answer
        }
        st.session_state.data = data
    display_question_and_handle_answer()

if __name__ == "__main__":
    main()
