"use client";

import Link from "next/link";
import Image from "next/image";
import Button from "../UI/Button";
import { usePathname } from "next/navigation";

const LoginButton = ({}) => {
    const pathname = usePathname().split("/").filter(Boolean)[0];

    return (
        <div>
            {pathname === "login" ? (
                <Link href="/">
                    <Button variant="highlight" status="pressed">
                        <Image
                            src="/assets/icons/Signin-Login.svg"
                            alt="Menu"
                            width={20}
                            height={20}
                            style={{marginRight: "4px"}}
                        />
                        Login
                    </Button>
                </Link>
            ) : (
                <Link href="/login">
                    <Button variant="primary">
                        <Image
                            src="/assets/icons/Signin-Login.svg"
                            alt="Menu"
                            width={20}
                            height={20}
                            style={{ filter: "brightness(0) invert(1)", marginRight: "4px" }}
                        />
                        Login
                    </Button>
                </Link>
            )}
        </div>
    )
}

export default LoginButton;