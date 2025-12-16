import matplotlib.pyplot as plt
import numpy as np

# Class labels
classes = [
    "Healthy",
    "Black Rot",
    "Alternaria Leaf Spot",
    "Downy Mildew",
    "Leaf Blight / Soft Rot",
    "Pest Damage"
]

# Example confusion matrix (you can replace with real values)
cm = np.array([
    [8, 1, 0, 0, 0, 1],
    [0, 7, 1, 0, 0, 0],
    [0, 0, 9, 1, 0, 0],
    [0, 0, 1, 8, 0, 1],
    [0, 0, 0, 1, 7, 1],
    [0, 1, 0, 0, 1, 8]
])

plt.figure(figsize=(9, 7))

# Soft, professional colormap
plt.imshow(cm, cmap="Blues")

# Title in academic style
plt.title("Confusion Matrix for Leaf Health and Disease Classification", fontsize=14, fontweight='bold')

plt.xlabel("Predicted Class", fontsize=12)
plt.ylabel("True Class", fontsize=12)

# Tick labels
plt.xticks(range(len(classes)), classes, rotation=45, ha="right")
plt.yticks(range(len(classes)), classes)

# Add a faint grid for readability
plt.grid(False)

# Add text labels inside cells
for i in range(len(classes)):
    for j in range(len(classes)):
        value = cm[i, j]
        color = "black" if value < cm.max()/2 else "white"
        plt.text(j, i, value, ha="center", va="center", fontsize=11, color=color)

# Add color bar (simple + human friendly)
cbar = plt.colorbar()
cbar.set_label("Number of Samples", fontsize=11)

plt.tight_layout()
plt.show()
