from flask import Flask, request, jsonify
import tensorflow as tf
import numpy as np
import joblib
import os
import pickle
from tensorflow.keras.losses import MeanSquaredError
from collections import deque
from myModel import main
from collections import defaultdict


app = Flask(__name__)

USER_MODELS_DIR = "Mymodel/users"

THRESHOLD_WINDOW_SIZE = 20
THRESHOLD_MULTIPLIER = 1.2
BASELINE_THRESHOLD = 1.0

user_error_history = {}

def load_user_model(user_id):
    model_path = os.path.join(USER_MODELS_DIR, f"{user_id}_autoencoder_model.keras")
    scaler_path = os.path.join(USER_MODELS_DIR, f"{user_id}_scaler.pkl")
    
    if not os.path.exists(model_path) or not os.path.exists(scaler_path):
        return None, None
    
    autoencoder = tf.keras.models.load_model(model_path)
    scaler = joblib.load(scaler_path)
    
    return autoencoder, scaler

def process_user_data(dwell_time, elapsed_time, scaler):
    print("this is teh dwellTime in the process_user_data : ", dwell_time)
    print("this is teh elapsedspeed in the process_user_data : ", elapsed_time)

    combined_features = [[dwell, speed] for dwell, speed in zip(dwell_time, elapsed_time)]
    combined_features = np.array(combined_features)
    standardized_features = scaler.transform(combined_features)
    standardized_features = standardized_features.reshape(1, -1)
    print("Processed standardized features:", standardized_features)
    return standardized_features

def process_data(dwell_time, elapsed_time, scaler):
    print("this is the dwellTime in the process_user_data : ", dwell_time)
    print("this is the elapsedspeed in the process_user_data : ", elapsed_time)

    combined_features = np.array([[dwell, speed] for dwell, speed in zip(dwell_time, elapsed_time)])
    print("Combined features shape before scaling:", combined_features.shape)

    standardized_features = scaler.transform(combined_features)
    print("Processed standardized features:", standardized_features)

    return standardized_features

def calculate_dynamic_threshold(user_id, new_error, adjustment_factor=0.1):
    if user_id not in user_error_history:
        user_error_history[user_id] = deque(maxlen=THRESHOLD_WINDOW_SIZE)
    
    user_error_history[user_id].append(new_error)
    avg_error = np.mean(user_error_history[user_id])
    
    dynamic_threshold = max(BASELINE_THRESHOLD * (1 - adjustment_factor), avg_error)
    print(f"Updated dynamic threshold: {dynamic_threshold}")
    return dynamic_threshold

def predict_suspicious_login(autoencoder, new_login_data, threshold):
    reconstructions = autoencoder.predict(new_login_data)
    reconstruction_errors = np.mean(np.abs(reconstructions - new_login_data), axis=1)
    is_suspicious = reconstruction_errors > threshold
    return is_suspicious, reconstruction_errors

@app.route('/predict', methods=['POST'])
def predict():
    data = request.json

    if not data:
        return jsonify({"error": "No data provided"}), 400

    dwell_time = data.get('dwellTime')
    elapsed_time = data.get('elapsedTime')
    user_id = data.get('userID')

    if dwell_time is None or elapsed_time is None or user_id is None:
        return jsonify({"error": "Missing 'dwellTime', 'elapsedTime', or 'userID' in request"}), 400

    dwell_time = np.array(dwell_time).flatten()
    elapsed_time = np.array(elapsed_time).flatten()

    autoencoder, scaler = load_user_model(user_id)

    if autoencoder is None or scaler is None:
        return jsonify({"error": f"No model found for userID: {user_id}"}), 404

    standardized_features = process_user_data(dwell_time, elapsed_time, scaler)

    _, reconstruction_errors = predict_suspicious_login(autoencoder, standardized_features, threshold=0.9)
    reconstruction_error = reconstruction_errors[0]

    dynamic_threshold = calculate_dynamic_threshold(user_id, reconstruction_error)

    print("this is the dynamic threshold :", dynamic_threshold)

    is_suspicious = reconstruction_error > dynamic_threshold

    print(f"Reconstruction error: {reconstruction_error}")

    response = {
        "is_suspicious": bool(is_suspicious),
        "reconstruction_error": float(reconstruction_error),
        "dynamic_threshold": float(dynamic_threshold),
        "userID": user_id
    }

    return jsonify(response)

@app.route('/train', methods=['POST'])
def train_model():
    data = request.json
    if not data:
        return jsonify({"error": "No data provided"}), 400
    
    print("this is the data sent to the training : ", data)
        
    fetched_user_id = data.get('userID')
    fetched_dwell_times = data.get('dwellTime')
    fetched_elapsed_times = data.get('elapsedTime')

    dwell_times = []
    elapsed_times = []
    user_id = []

    dwell_times.append(fetched_dwell_times)
    elapsed_times.append(fetched_elapsed_times)
    user_id.append(fetched_user_id)

    if not user_id or not dwell_times or not elapsed_times:
        return jsonify({"error": "Missing required data"}), 400

    autoencoder, scaler = load_user_model(user_id)

    if autoencoder != None and scaler != None :
        return jsonify({"message": "there is already a model for this user "}), 403

    dwell_times = np.array(dwell_times, dtype=object) 
    elapsed_times = np.array(elapsed_times, dtype=object)
    user_id = np.array(user_id, dtype=object)
    
    main({
        "dwellTime": dwell_times,
        "elapsedTime": elapsed_times,
        "userID": user_id
    })

@app.route('/incremental_train', methods=['POST'])
def incremental_train():
    data = request.json
    if not data:
        return jsonify({"error": "No data provided"}), 400

    fetched_user_id = data.get('userID')
    fetched_dwell_times = data.get('dwellTime')
    fetched_elapsed_times = data.get('elapsedTime')

    if not fetched_user_id or not fetched_dwell_times or not fetched_elapsed_times:
        return jsonify({"error": "Missing 'userID', 'dwellTime', or 'elapsedTime' in request"}), 400
    
    dwell_times = np.array(fetched_dwell_times).flatten()
    elapsed_times = np.array(fetched_elapsed_times).flatten()
    
    autoencoder, scaler = load_user_model(fetched_user_id)
    if autoencoder is None or scaler is None:
        return jsonify({"error": f"No model found for userID: {fetched_user_id}"}), 404

    autoencoder.compile(optimizer='adam', loss= MeanSquaredError())
    
    standardized_features = process_data(dwell_times, elapsed_times, scaler)

    autoencoder.fit(standardized_features, standardized_features, epochs=1, verbose=1)

    model_path = os.path.join(USER_MODELS_DIR, f"{fetched_user_id}_autoencoder_model.keras")
    autoencoder.save(model_path)

    return jsonify({"message": f"Model for user {fetched_user_id} incrementally trained with new data"}), 200


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
