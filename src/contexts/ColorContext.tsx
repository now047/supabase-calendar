import React, { createContext, useContext, useMemo, useState } from "react";
import { colorMap } from "../lib/resource-utils";

const ColorContext = createContext({
    colors: new Map<any, string>(),
    hue: 5,
    setHue: (h: number) => {},
});

const ColorContextProvider = ({ children }: any) => {
    const [hue, setHue] = useState<number>(5);
    const colors = useMemo(() => colorMap(hue), [hue]);
    const currentColorContext = {
        colors: colors,
        hue: hue,
        setHue: setHue,
    };

    return (
        <ColorContext.Provider value={currentColorContext}>
            {children}
        </ColorContext.Provider>
    );
};

const useColor = () => {
    return useContext(ColorContext);
};

export { useColor, ColorContextProvider };
