// Single source of truth for the demo tabs. Each entry maps to one notebook.
export type ModelTab = {
  id: string;
  nb: string;
  title: string;
  tagline: string;
  dataset: string;
  help: string; // shown in the panel's "?" tooltip
};

export const MODEL_TABS: ModelTab[] = [
  {
    id: "tree", nb: "01", title: "Decision Tree", dataset: "Adult Income",
    tagline: "Configure a person, pick a tree depth, and watch the tree walk its yes/no questions down to a prediction.",
    help: "A decision tree predicts by asking a chain of yes/no questions about the features. It only ever asks about the few features on the path it took — so changing a control that isn't on the path won't move the prediction.",
  },
  {
    id: "boost", nb: "02", title: "Boosting", dataset: "Adult Income",
    tagline: "A real 80-tree LightGBM runs live in your browser — change any feature and watch the income probability respond.",
    help: "Boosting adds many small trees together, each fixing the last one's mistakes. Unlike a single tree, it uses every feature — so every control here moves the prediction.",
  },
  {
    id: "ensemble", nb: "03", title: "Ensembles", dataset: "Adult Income",
    tagline: "Toggle base models in and out of a soft-voting ensemble and watch accuracy and diversity respond.",
    help: "An ensemble combines several models by averaging their votes. It only helps when the models disagree — combining diverse models beats combining similar ones.",
  },
  {
    id: "knnsvm", nb: "05", title: "k-NN & SVM", dataset: "make_moons",
    tagline: "Switch k, the kernel, C and gamma, and watch the decision boundary reshape on 2D data.",
    help: "Two distance-based models drawing boundaries on 2D 'two-moons' data. k-NN votes among nearest neighbors; SVM finds the widest separating margin, curving it with a kernel.",
  },
  {
    id: "interp", nb: "06", title: "Interpretability", dataset: "Adult Income",
    tagline: "See how a feature moves predictions on average, and why individual people got the scores they did.",
    help: "Explainability tools for the boosting model: partial-dependence shows a feature's average effect; SHAP breaks one person's prediction into per-feature contributions.",
  },
  {
    id: "threshold", nb: "07", title: "Threshold", dataset: "Adult Income",
    tagline: "Drag the decision threshold and watch the confusion matrix, precision, recall, and the ROC and precision-recall operating points move in real time.",
    help: "A classifier outputs a probability; the threshold turns it into a yes/no. Moving it trades catching more positives (recall) against fewer false alarms (precision).",
  },
  {
    id: "about", nb: "—", title: "About", dataset: "the whole series",
    tagline: "What every model here is, what each demo shows you, and how it all fits together.",
    help: "A plain-language guide to all the models and demos in this playground.",
  },
];
