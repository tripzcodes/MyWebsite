# Wine Quality Classification: Model Selection and Analysis

## Introduction

The objective of this analysis was to build and evaluate machine learning models to classify wine quality based on various chemical properties. The dataset consisted of red and white wines, with features such as acidity, sugar content, and alcohol levels, along with a quality rating. To simplify the problem, Iconverted the quality scores into a binary classification:  
- `0` (Bad Wine) for scores less than 6.  
- `1` (Good Wine) for scores 6 or higher.

I explored three main models:
- **Random Forest**: Known for handling high-dimensional data efficiently.  
- **K-Nearest Neighbors (KNN)**: Effective for simple datasets but can struggle with dimensionality.  
- **XGBoost**: A powerful boosting algorithm that often achieves state-of-the-art performance.

To enhance performance, Iapplied feature selection, normalization, PCA, and extensive hyperparameter tuning. The goal was to maximize accuracy while preventing overfitting. In this report, Idiscuss the performance of each model based on accuracy, confusion matrices, and learning curves.

---

# Analysis of Model Performance

## 1. Overfitting vs. Underfitting

### **Random Forest**
- **Training Accuracy:** `~94-95%`
- **Validation Accuracy:** `~76%`
- Shows signs of slight overfitting but controlled with hyperparameter tuning (`max_depth=30`, `min_samples_split=10`, `min_samples_leaf=2`).
- Performs well but can struggle with noisy data.
- **Improvements:** Increasing the `max_depth` and adding a `min_samples_leaf` parameter helped reduce overfitting compared to initial runs with over 50% accuracy.

### **K-Nearest Neighbors (KNN)**
- **Training Accuracy:** `~78%`
- **Validation Accuracy:** `~73.5%`
- Less prone to overfitting but struggles with high-dimensional data.
- **Improvements:** Applying PCA to reduce dimensions and selecting an optimal `k` improved accuracy from 50% to ~73.5%.

### **XGBoost**
- **Training Accuracy:** `~98%` (initially high), reduced via `subsample=0.8`, `learning_rate=0.01`.
- **Validation Accuracy:** `~76%`
- Best balance between preventing overfitting and achieving high accuracy.
- **Improvements:** Reducing `learning_rate` and controlling tree growth significantly improved accuracy and prevented severe overfitting.

---

## 2. Confusion Matrix Insights

| Model          | Precision (Bad Wine) | Recall (Bad Wine) | Precision (Good Wine) | Recall (Good Wine) |
|---------------|--------------------|------------------|--------------------|------------------|
| **Random Forest** | `70%` | `63%` | `79%` | `84%` |
| **KNN**        | `69%` | `59%` | `77%` | `84%` |
| **XGBoost**    | `70%` | `64%` | `80%` | `84%` |

- **Random Forest:** Struggles with minority class (bad wines), but has higher precision.
- **KNN:** Higher misclassification of bad wines.
- **XGBoost:** Best recall for bad wines, indicating stronger decision boundaries.

---

## 3. Model Comparison

| Model          | Cross-Validation Accuracy | Test Accuracy |
|---------------|--------------------------|--------------|
| **Random Forest** | **`76.53%`** | **`76.13%`** |
| **KNN**       | **`73.47%`** | **`74.81%`** |
| **XGBoost**   | **`76.08%`** | **`76.41%`** |

- **Random Forest:** High accuracy, but slightly overfits.
- **KNN:** Performs worse on high-dimensional data.
- **XGBoost:** Best generalization with stable accuracy.

---

## 4. Learning Curve Analysis

- **Random Forest:** 
  - Training accuracy is stable (`~94-95%`), while validation accuracy reaches (`~76%`).
  - Indicates slight overfitting but remains robust.

- **KNN:** 
  - Training and validation scores increase gradually, suggesting more data could improve performance.
  - Struggles with misclassified minority classes.

- **XGBoost:**
  - Initially overfits (`~98%` training accuracy) but stabilizes at (`~76%` test accuracy).
  - Shows good generalization when tuned properly.

---

## 5. Conclusions

### **Feature Selection Impact**
- Increasing features from `6 → 10` improved performance.
- PCA helped in dimensionality reduction, especially for KNN.

### **Hyperparameter Tuning Insights**
- Random Forest benefitted from refining `max_depth`, `min_samples_split`, and `min_samples_leaf`.
- XGBoost improved after reducing `learning_rate` and adding `subsample=0.8` to control variance.

### **Improvements Achieved**
- **KNN:** Accuracy increased from ~50% to ~73.5% through PCA and tuning `k`.
- **Random Forest:** Improved from ~50% to ~76% by optimizing tree depth and sample splits.
- **XGBoost:** Achieved highest accuracy (~76.41%) with controlled overfitting.

### **Best Model Decision**
- **XGBoost** achieved the highest test accuracy (**`76.41%`**).
- Random Forest was slightly behind but still reliable.
- KNN, while simple, struggled compared to tree-based models.

**Final Choice:** XGBoost performs the best in terms of balancing accuracy and generalization.
