## Currency Rate Widget

## Getting Started

Follow these steps to run the project locally.

### 1. Clone the repository

```bash
git clone https://github.com/pshy4ok/test-task-crmium.git
cd widget
```

### 2. Install dependencies

Using npm:

```bash
npm install
```

### 3. Run the project locally

```bash
zet run
```

After the dev server starts, open the address printed in the terminal. Since the project will be launched locally, you will only see an infinite load, as there is no Deal with currency rate locally, but in Zoho CRM you will see a fully working version.

### 4. Integrate widget to Zoho CRM

Go to Zoho CRM, then create a new Deal with the Currency Rate field of type Decimal. Then go to Deal details and click ```Add Related List -> Widgets -> New Widget```.

Fill in all fields in the form:

- ```Name``` Name of the widget
- ```Description``` (optional)
- ```Type``` Related List
- ```Hosting``` External
- ```Base URL``` Enter the link https://127.0.0.1:5000/app/ if you launched the project locally, if not, then enter https://pshy4ok.github.io/test-task-crmium/widget/app/index.html
**To avoid widget issues, it's better to use the Github Pages link.**

Then click ```Save -> Install```. Done, you can test the widget.