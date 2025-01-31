import Button from "../_components/Button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../_components/Card";
import Input from "../_components/Input";
import Badge from "../_components/Badge";
import DatePicker from "../_components/DatePicker";

const SessionPage = () => {
  return (
    <>
      <div style={{ display: "flex", gap: "1em", padding: "20px" }}>
        <Button size="lg">{`size="lg"`}</Button>
        <Button size="md">{`size="md"`}</Button>
        <Button size="sm">{`size="sm"`}</Button>
        <Button size="icon">{`i`}</Button>
      </div>
      <div style={{ display: "flex", gap: "1em", padding: "20px" }}>
        <Button variant="primary">{`variant="primary"`}</Button>
        <Button variant="secondary">{`variant="secondary"`}</Button>
        <Button variant="accent">{`variant="accent"`}</Button>
      </div>
      <div style={{ display: "flex", gap: "1em", padding: "20px" }}>
        <Button variant="highlight">{`variant="highlight"`}</Button>
        <Button variant="medium">{`variant="medium"`}</Button>
        <Button variant="outline">{`variant="outline"`}</Button>
      </div>
      <div style={{ display: "flex", gap: "1em", padding: "20px" }}>
        <Input type="email" placeholder="Default" />
        <Input disabled type="email" placeholder="Disabled" />
      </div>
      <div style={{ display: "flex", gap: "1em", padding: "20px" }}>
        <Card style={{ width: "300px" }}>
          <CardHeader>
            <CardTitle>Title</CardTitle>
          </CardHeader>
          <CardContent>
            <div
              style={{ display: "flex", flexDirection: "column", gap: "1em" }}
            >
              <Input type="email" placeholder="Input" />
              <Input type="email" placeholder="Input 2" />
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="secondary">Cancel</Button>
            <Button variant="highlight">Ok</Button>
          </CardFooter>
        </Card>

        <Card style={{ width: "350px" }}>
          <CardHeader>
            <CardTitle>Title</CardTitle>
            <CardDescription>Description</CardDescription>
            <Badge variant="highlight">Status</Badge>
          </CardHeader>
          <CardContent>
            <ul>
              <li>{`Aberama`}</li>
              <li>{`Cleiton Rasta`}</li>
              <li>{`Aborto do Cavaco`}</li>
            </ul>
          </CardContent>
          <CardFooter>Footer</CardFooter>
        </Card>
      </div>

      <div style={{ display: "flex", gap: "1em", padding: "20px" }}>
        <Badge>Badge</Badge>
        <Badge variant="highlight">Highlight</Badge>
        <Badge variant="outline">Outline</Badge>
        <Badge variant="medium">Medium</Badge>
      </div>

      <div style={{ display: "flex", gap: "1em", padding: "20px" }}>
        <DatePicker />
      </div>
    </>
  );
};

export default SessionPage;
