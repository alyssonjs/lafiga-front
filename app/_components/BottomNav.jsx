"use client";

import Link from "next/link";
import styles from "../_styles/BottomNav.module.css";
import Button from "./Button";
import { useState } from "react";
import { usePathname } from "next/navigation";

const BottomNav = () => {
  const pathname = usePathname().split("/").filter(Boolean)[0];
  const [current, setCurrent] = useState(pathname);

  console.log(current);

  const handleMenu = (value) => {
    setCurrent(value);
  };

  return (
    <div className={styles.bottomNav}>
      <div className={styles.bottomNavMenu}>
      <Link href="/components" onClick={() => handleMenu("components")}>
          {current === "components" ? (
            <Button variant="highlight" status="pressed">Home</Button>
          ) : (
            <Button size="icon" variant="primary">
              H
            </Button>
          )}
        </Link>

        <Link href="/calendar" onClick={() => handleMenu("calendar")}>
          {current === "calendar" ? (
            <Button variant="highlight" status="pressed">Quadro de Sessões</Button>
          ) : (
            <Button size="icon" variant="primary">
              QS
            </Button>
          )}
        </Link>

        <Link href="/login" onClick={() => handleMenu("login")}>
          {current === "login" ? (
            <Button variant="highlight" status="pressed">Login</Button>
          ) : (
            <Button size="icon" variant="primary">
              L
            </Button>
          )}
        </Link>
      </div>
    </div>
  );
};

export default BottomNav;
