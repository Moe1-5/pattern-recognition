import tensorflow as tf
import numpy as np
from sklearn.preprocessing import StandardScaler
from tensorflow.keras.losses import MeanSquaredError
import joblib
from server import fetch_user_data
import os
import pickle
import matplotlib.pyplot as plt

def process_user_data(user_data):
    combined_features = []
    for session_dwell, session_speed in zip(user_data['dwellTime'], user_data['elapsedTime']):
        session_features = [[dwell, session_speed] for dwell in session_dwell]

        combined_features.extend(session_features)
    combined_features = np.array(combined_features)
    print("this is the combined feature :", combined_features)
    scaler = StandardScaler()
    standardized_features = scaler.fit_transform(combined_features)
    return standardized_features, scaler

def create_autoencoder(input_shape):
    input_layer = tf.keras.layers.Input(shape=(input_shape,))
    encoded = tf.keras.layers.Dense(16, activation='relu')(input_layer)
    encoded = tf.keras.layers.Dense(8, activation='relu')(encoded)
    decoded = tf.keras.layers.Dense(16, activation='relu')(encoded)
    decoded = tf.keras.layers.Dense(input_shape, activation='sigmoid')(decoded)
    autoencoder = tf.keras.Model(inputs=input_layer, outputs=decoded)
    autoencoder.compile(optimizer='adam', loss=MeanSquaredError())
    return autoencoder

def train_autoencoder(autoencoder, train_data, epochs=20, batch_size=5):
    autoencoder.fit(train_data, train_data, epochs=epochs, batch_size=batch_size, shuffle=True)

def evaluate_anomaly(autoencoder, input_data):
    reconstructions = autoencoder.predict(input_data)
    reconstruction_errors = np.mean(np.abs(reconstructions - input_data), axis=1)
    return reconstruction_errors

def plot_scatter_and_histogram(standardized_features, reconstruction_errors):
    plt.figure(figsize=(12, 6))
    plt.subplot(1, 2, 1)
    plt.scatter(standardized_features[:, 0], standardized_features[:, 1], alpha=0.6)
    plt.title('Scatter Plot of Standardized Features')
    plt.xlabel('Dwell Time')
    plt.ylabel('Session Speed')
    plt.subplot(1, 2, 2)
    plt.hist(reconstruction_errors, bins=30, alpha=0.7, color='orange')
    plt.title('Histogram of Reconstruction Errors')
    plt.xlabel('Reconstruction Error')
    plt.ylabel('Frequency')
    plt.tight_layout()
    plt.show()

def determine_threshold(reconstruction_errors, percentile=95):
    return np.percentile(reconstruction_errors, percentile)

def predict_suspicious_login(autoencoder, new_login_data, threshold_percentile=95):
    error = evaluate_anomaly(autoencoder, new_login_data)
    plot_scatter_and_histogram(new_login_data, error)
    determined_threshold = determine_threshold(error, percentile=threshold_percentile)
    print(f"Determined threshold for anomaly detection: {determined_threshold}")
    is_suspicious = error > determined_threshold
    return is_suspicious.any()

def save_model(autoencoder, model_path):
    autoencoder.save(model_path)
    print(f"Model saved to {model_path}")

def save_scaler(scaler, scaler_path):
    joblib.dump(scaler, scaler_path)
    print(f"Scaler saved to {scaler_path}")

def main(user_data = None):
    data = user_data if user_data is not None else fetch_user_data()
    print("this is the data in the model : ", data)
    user_ids = data['userID']
    os.makedirs("Mymodel/users", exist_ok=True)
    for i, user_id in enumerate(user_ids):
        user_data = {
            "dwellTime": data['dwellTime'][i],
            "elapsedTime": data['elapsedTime'][i]
        }
        standardized_features, scaler = process_user_data(user_data)
        autoencoder = create_autoencoder(standardized_features.shape[1])
        train_autoencoder(autoencoder, standardized_features)
        model_path = f"Mymodel/users/{user_id}_autoencoder_model.keras"
        scaler_path = f"Mymodel/users/{user_id}_scaler.pkl"
        save_model(autoencoder, model_path)
        with open(scaler_path, "wb") as scaler_file:
            pickle.dump(scaler, scaler_file)
        
        is_suspicious = predict_suspicious_login(autoencoder, standardized_features)
        print(f"Is the login suspicious for user {user_id}? {'Yes' if is_suspicious else 'No'}\n")

if __name__ == "__main__":
    main()
