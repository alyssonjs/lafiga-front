"use client";
import React, { useState } from "react";
import styles from "../_styles/Dice.module.css";
import Button from "./Button";
import Card, { CardContent, CardFooter, CardHeader, CardTitle } from "./Card";
import Input from "./Input";
import diceApi from "../_services/diceApi";

const Dice = () => {
  const [showPopover, setShowPopover] = useState(false);
  const [expression, setExpression] = useState("");
  const [rollResult, setRollResult] = useState(null);

  const togglePopover = () => {
    setShowPopover(!showPopover);
  };

  const handleRollDice = async () => {
    try {
      const response = await diceApi.post("/roll", { expression });
      console.log(response);
      setRollResult(response);
    } catch (error) {
      console.error("Erro ao rolar os dados:", error);
    }
  };

  const fetchHistory = async () => {
    try {
      const response = await diceApi.get("/history");
      console.log(response);
    } catch (error) {
      console.error("Erro ao buscar histórico:", error);
    }
  };

  return (
    <div>
      <Button className={styles.floatingButton} onClick={togglePopover}>
        Roll Dice
      </Button>
      {showPopover && (
        <div className={styles.popover}>
          <Card style={{ width: "300px" }}>
            <CardHeader>
              <CardTitle>Roll Dice</CardTitle>
            </CardHeader>
            <CardContent>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "1em",
                }}
              >
                {rollResult && (
                  <div>
                    <p>
                      <strong>Total:</strong> {rollResult.total}
                    </p>
                    <p>
                      <strong>Rolls:</strong>{" "}
                    </p>
                    {rollResult.rolls.map((roll, key) => (
                      <p key={key}>
                        [ {roll.join(", ")} ] | {rollResult.expression}
                      </p>
                    ))}
                  </div>
                )}
                <Input
                  type="text"
                  id="expression"
                  name="expression"
                  required
                  placeholder="Expression"
                  value={expression}
                  onChange={(e) => setExpression(e.target.value)}
                />
              </div>
            </CardContent>
            <CardFooter>
              <div className={styles.footer}>
                <Button variant="highlight" onClick={handleRollDice}>
                  Roll!
                </Button>
                {/* <Button variant="secondary" onClick={fetchHistory}>
                  Fetch History
                </Button> */}
              </div>
            </CardFooter>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Dice;
