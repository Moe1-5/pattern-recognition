import pymongo
import numpy as np

# Connect to MongoDB
try:
    client = pymongo.MongoClient("mongodb+srv://Mohammed:Mohammed@coding-projects.tmed77f.mongodb.net/?retryWrites=true&w=majority&appName=coding-projects")
    client.admin.command('ping')  # Check connection
    print("MongoDB connection successful")
except Exception as e:
    print("Error connecting to MongoDB:", e)

# Access the database and collection
db = client["user-collection"]
collection = db["users"]

def fetch_user_data():
    # Check document count first
    doc_count = collection.count_documents({})
    print(f"Number of documents in 'user-collection': {doc_count}")
    
    if doc_count == 0:
        print("No documents found in the collection.")
        return {
            "dwellTime": np.array([]),
            "elapsedTime": np.array([]),
            "userID": np.array([])
        }

    # Initialize lists
    dwell_times = []
    elapsed_times = []
    user_ids = []

    # Fetch and process documents
    users = collection.find()
    for user in users:
        # Use .get() with a default empty list for missing fields
        dwell_time = user.get('dwellTime', [])
        elapsed_time = user.get('elapsedspeed', [])
        
        # Ensure that both fields are non-empty before appending
        if dwell_time and elapsed_time:
            dwell_times.append(dwell_time)
            elapsed_times.append(elapsed_time)
            user_ids.append(user.get('_id'))  # Collect user ID as well if needed
        else:
            # print(f"this is the dwell Time of {user.get('_id', 'unknown')}:", dwell_time)
            # print(f"this is the elapsed Time of {user.get('_id', 'unknown')}:", elapsed_time)
            print(f"Skipping user {user.get('_id', 'unknown')} due to missing or empty fields.")

    # Convert lists to numpy arrays
    dwell_times = np.array(dwell_times, dtype=object)  # Set dtype=object for empty lists
    elapsed_times = np.array(elapsed_times, dtype=object)
    user_ids = np.array(user_ids, dtype=object)
    
    # print(f"dwellTime : {dwell_times}\n this is the elapsedTime :  {elapsed_time}\n this is the userID : {user_ids}")


    return {
        "dwellTime": dwell_times,
        "elapsedTime": elapsed_times,
        "userID": user_ids
    }

# Fetch data
user_data = fetch_user_data()
# print("Fetched user data:", user_data)
