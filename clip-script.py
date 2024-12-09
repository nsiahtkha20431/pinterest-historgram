import sys
import json
import torch
import clip
from PIL import Image

def run_clip(image_path):
    device = "cuda" if torch.cuda.is_available() else "cpu" # determines whether to run on gpu or cpu
    model, preprocess = clip.load("ViT-B/32", device=device) # load model and preprocessing tool

    image = preprocess(Image.open(image_path)).unsqueeze(0).to(device) # open image and preprocess
    text = clip.tokenize(["chic style", "goth style", "kawaii style", "vintage style", "punk style", "avante-garde style", "grunge style", "emo style"]).to(device)
    with torch.no_grad():
        logits_per_image, _ = model(image, text)
        probs = logits_per_image.softmax(dim=-1).cpu().numpy()[0]

    styles = [
        "chic style", 
        "goth style", 
        "kawaii style", 
        "vintage style",
        "punk style",
        "avante-garde style",
        "grunge style",
        "emo style"
    ]
    max_idx = probs.argmax()
    dominant_style = styles[max_idx]

    return dominant_style

if __name__ == "__main__":
    image_path = sys.argv[1]  # Get image path from command-line argument
    result = run_clip(image_path)
    print(result)  # Print the dominant style

