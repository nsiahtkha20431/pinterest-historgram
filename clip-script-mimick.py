import sys
import json

def mock_clip(image_path):
    # Mock response: probabilities for each style
    styles = ["chic style", "goth style", "kawaii style", "vintage style"]
    # Simulating a high probability for "goth style"
    probs = [0.05, 0.85, 0.05, 0.05]

    # Creating a dictionary to mimic the structure of the CLIP output
    response = {style: prob for style, prob in zip(styles, probs)}
    return response

if __name__ == "__main__":
    image_path = sys.argv[1]  # Get image path from command-line argument
    result = mock_clip(image_path)
    print(json.dumps(result))  # Print the result as a JSON string
