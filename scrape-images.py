import requests

def download_image(image_url, local_file_base_name, counter): 
    local_file_name = f"{local_file_base_name}_{counter}.jpg"

    response = requests.get(image_url, stream=True) # requests.get --> HTTP GET request to the image URL
    if response.status_code == 200: # if request is successful, then ...
        with open(local_file_name, 'wb') as file: # opens a file in binary write mode ('wb') 
            for chunk in response.iter_content(1024): # writes the content of the response to it in chunks
                file.write(chunk)
        print(f"Image successfully downloaded: {local_file_name}")
    else:
        print("Unable to download the image.") # else error

# Example usage
image_urls = "https://media.tenor.com/yazm_5b6PKwAAAAM/cute-cat.gif", "https://d2zp5xs5cp8zlg.cloudfront.net/image-83814-800.jpg", "https://hips.hearstapps.com/hmg-prod/images/beautiful-smooth-haired-red-cat-lies-on-the-sofa-royalty-free-image-1678488026.jpg", "https://i.ytimg.com/vi/SQJrYw1QvSQ/maxresdefault.jpg"
for i, url in enumerate(image_urls):
    download_image(url, "local_image", i)
