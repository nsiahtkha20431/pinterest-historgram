import torch
import clip
from PIL import Image

device = "cuda" if torch.cuda.is_available() else "cpu"
model, preprocess = clip.load("ViT-B/32", device=device)

image_path = "C:\\Users\\Admin\\Desktop\\pinterest-histogram\\pintrest-sample-images\\vintage-sample.jpg"
image = preprocess(Image.open(image_path)).unsqueeze(0).to(device)

text = clip.tokenize(["chic style", "goth style", "kawaii style"]).to(device)

with torch.no_grad():
    image_features = model.encode_image(image)
    text_features = model.encode_text(text)
    
    logits_per_image, logits_per_text = model(image, text)
    probs = logits_per_image.softmax(dim=-1).cpu().numpy()

print("Label probs:", probs)  # prints: [[0.9927937  0.00421068 0.00299572]]

#how do i run this script?