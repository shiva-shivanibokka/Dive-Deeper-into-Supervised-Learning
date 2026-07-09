// Single source of truth for the demo tabs. Each entry maps to one notebook.
export type ModelTab = {
  id: string;
  nb: string;
  title: string;
  tagline: string;
  dataset: string;
};

export const MODEL_TABS: ModelTab[] = [
  { id: "tree",      nb: "01", title: "Decision Tree",   tagline: "Configure a person, pick a tree depth, and watch it walk the decision path to a prediction.", dataset: "Adult Income" },
  { id: "boost",     nb: "02", title: "Boosting (LightGBM)", tagline: "A real 80-tree LightGBM runs live in your browser — change a feature and watch the income probability move.", dataset: "Adult Income" },
  { id: "ensemble",  nb: "03", title: "Ensembles",       tagline: "Toggle base models in and out of a soft-voting ensemble and see how accuracy and diversity respond.", dataset: "Adult Income" },
  { id: "knnsvm",    nb: "05", title: "k-NN & SVM",       tagline: "See how k, the kernel, C and gamma reshape the decision boundary on 2D data.", dataset: "make_moons" },
  { id: "interp",    nb: "06", title: "Interpretability", tagline: "Partial-dependence curves and per-person SHAP explanations for the boosting model.", dataset: "Adult Income" },
  { id: "threshold", nb: "07", title: "Threshold Selector", tagline: "Drag the decision threshold and watch the confusion matrix, precision/recall, and ROC/PR points update live.", dataset: "Adult Income" },
];
