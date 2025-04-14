"use client";

import Link from "next/link";
import styles from "../_styles/BottomNav.module.css";
import Button from "./Button";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "../_context/AuthContext";

const BottomNav = () => {
  const pathname = usePathname().split("/").filter(Boolean)[0];
  const [current, setCurrent] = useState(pathname);
  // Nao estamos usando as permissoes ainda.
  const { user, role, permissions, logoutUser } = useAuth();

  const handleMenu = (value) => {
    setCurrent(value);
  };

  return (
    <div className={styles.bottomNav}>
      <div className={styles.bottomNavMenu}>
      { role === 'Admin' &&
        <Link href="/components" onClick={() => handleMenu("components")}>
          {current === "components" ? (
            <Button variant="highlight" status="pressed">Home</Button>
          ) : (
            <Button size="icon" variant="primary">
              H
            </Button>
          )}
        </Link>
        }

        { role === 'Admin' &&
        <Link href="/groups" onClick={() => handleMenu("groups")}>
          {current === "groups" ? (
            <Button variant="highlight" status="pressed">Grupos</Button>
          ) : (
            <Button size="icon" variant="primary">
              G
            </Button>
          )}
        </Link>
        }

        <Link href="/calendar" onClick={() => handleMenu("calendar")}>
          {current === "calendar" ? (
            <Button variant="highlight" status="pressed">Quadro de Sessões</Button>
          ) : (
            <Button size="icon" variant="primary">
              QS
            </Button>
          )}
        </Link>

        <Link href="/characters" onClick={() => handleMenu("characters")}>
          {current === "characters" ? (
            <Button variant="highlight" status="pressed">Personagens</Button>
          ) : (
            <Button size="icon" variant="primary">
              P
            </Button>
          )}
        </Link>

          { !user ?
              <Link href="/login" onClick={() => handleMenu("login")}>
              {current === "login" ? (
                <Button variant="highlight" status="pressed">Login</Button>
              ) : (
                <Button size="icon" variant="primary">
                  L
                </Button>
              )}
            </Link> : <Button variant="primary" onClick={() => logoutUser()}>Desconctar</Button>
          }

      </div>
    </div>
  );
};

export default BottomNav;
