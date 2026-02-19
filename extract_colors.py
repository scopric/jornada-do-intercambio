
from PIL import Image
from sklearn.cluster import KMeans
import numpy as np
from collections import Counter

def get_dominant_colors(image_path, num_colors=5):
    try:
        image = Image.open(image_path)
        image = image.resize((150, 150)) # Resize for speed
        image_np = np.array(image)
        pixels = image_np.reshape(-1, 3)

        kmeans = KMeans(n_clusters=num_colors)
        kmeans.fit(pixels)

        colors = kmeans.cluster_centers_
        counts = Counter(kmeans.labels_)

        hex_colors = []
        for i in range(len(colors)):
            color = colors[i]
            hex_color = '#{:02x}{:02x}{:02x}'.format(int(color[0]), int(color[1]), int(color[2]))
            hex_colors.append((hex_color, counts[i]))
        
        # Sort by most frequent
        hex_colors.sort(key=lambda x: x[1], reverse=True)
        return [c[0] for c in hex_colors]

    except Exception as e:
        print(f"Error: {e}")
        return []

# Use the image path provided
image_path = "/Users/felippecardoso/.gemini/antigravity/brain/tempmediaStorage/media__1771467798627.jpg"
colors = get_dominant_colors(image_path, num_colors=8)
print("Dominant Colors:", colors)
