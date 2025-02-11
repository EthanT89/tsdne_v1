import { useState } from "react";
import Alert from "./components/Alert";
import Button from "./components/Button";
import ListGroup from "./components/ListGroup";
import Title from "./components/Title";

function App() {
  const [alertVisible, setAlertVisibility] = useState(false);
  const items = ["Lake Arrowhead", "Los Angeles", "Crestline", "Tulsa"];
  const handleSelectItem = (item: string) => {
    console.log(item);
  };

  return (
    <div className="bg-slate-900">
      <Title />
      {alertVisible && (
        <Alert onClose={() => setAlertVisibility(false)}>
          Hello<span>World</span>
        </Alert>
      )}
      <Button color="danger" onClick={() => setAlertVisibility(true)}>
        My Button
      </Button>

      <ListGroup
        items={items}
        heading="Cities"
        onSelectItem={handleSelectItem}
      />
    </div>
  );
}

export default App;
