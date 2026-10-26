"use client";

import { SystemIconButton } from "./SystemPrimitives";
import Icon from "./Icon";
import React, { useState, useEffect } from "react";

export default function ReturnTop() {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            if (window.scrollY > 400) {
                setVisible(true);
            } else {
                setVisible(false);
            }
        };

        window.addEventListener("scroll", handleScroll, { passive: true });
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth",
        });
    };

    if (!visible) return null;

    return (
        <SystemIconButton data-component-id="return-top" data-text="action"
            variant="secondary"
            className="return-top is-visible"
            type="button"
            aria-label="맨 위로 이동"
            onClick={scrollToTop}
        >
            <Icon name="up" />
        </SystemIconButton>
    );
}
