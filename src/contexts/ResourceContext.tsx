import React, { createContext, useContext, useState, useRef } from "react";
import Resource from "../lib/resource-utils";

type ResourceType = {
    types: Map<string, boolean>;
    generations: Map<string, boolean>;
};

type ResourceContextType = {
    resourceTypes: ResourceType;
    resources: React.MutableRefObject<Resource[]> | null;
    selectedResources: Resource[];
    handleSelectChange: (kind: string, name: string, checked: boolean) => void;
    onUpdateResources: () => void;
};

const defaultResourceContext: ResourceContextType = {
    resourceTypes: {
        types: new Map<string, boolean>(),
        generations: new Map<string, boolean>(),
    },
    resources: null,
    selectedResources: [],
    handleSelectChange: (kind: string, name: string, checked: boolean) => {},
    onUpdateResources: () => {},
};

const ResourceContext = createContext(defaultResourceContext);

const ResourceContextProvider = ({ children }: any) => {
    const resources = useRef<Resource[]>([]);
    const [resourceTypes, setResourceTypes] = useState<ResourceType>({
        types: new Map<string, boolean>(),
        generations: new Map<string, boolean>(),
    });
    const [selectedResources, setSelectedResources] = useState(
        resources!.current
    );

    const handleSelectChange = (
        kind: string,
        name: string,
        checked: boolean
    ) => {
        setResourceTypes((prev) => {
            if (kind === "types") {
                prev?.types.set(name, checked);
            } else if (kind === "generations") {
                prev?.generations.set(name, checked);
            }
            return prev;
        });
        onUpdateResources();
    };

    const onUpdateResources = () => {
        console.log("onUpdateResources");
        const types = resources!.current
            .map((r) => r.type)
            .filter((v, i, a) => a.indexOf(v) === i);
        const generations = resources!.current
            .map((r) => r.generation)
            .filter((v, i, a) => a.indexOf(v) === i);

        setResourceTypes((prev) => {
            console.log("setResourceTypes", prev);
            if (prev !== undefined) {
                // add types
                types.map((type) => {
                    if (prev.types.get(type) === undefined) {
                        prev.types.set(type, true);
                    }
                });
                // remove types
                for (const type of prev.types.keys()) {
                    if (types.indexOf(type) === -1) {
                        prev.types.delete(type);
                    }
                }

                // add generations
                generations.map((gen) => {
                    if (prev.generations.get(gen) === undefined) {
                        prev.generations.set(gen, true);
                    }
                });
                // remove generations
                for (const gen of prev.generations.keys()) {
                    if (generations.indexOf(gen) === -1) {
                        prev.generations.delete(gen);
                    }
                }
                return prev;
            } else {
                return {
                    types: new Map(types.map((type) => [type, true])),
                    generations: new Map(generations.map((gen) => [gen, true])),
                };
            }
        });

        const newSelectedResources = resources!.current.filter(
            (r) =>
                resourceTypes.types.get(r.type) &&
                resourceTypes.generations.get(r.generation)
        );
        setSelectedResources(newSelectedResources);
    };

    const currentResourceContext: ResourceContextType = {
        resourceTypes: resourceTypes,
        resources: resources,
        selectedResources: selectedResources,
        handleSelectChange: handleSelectChange,
        onUpdateResources: onUpdateResources,
    };

    return (
        <ResourceContext.Provider value={currentResourceContext}>
            {children}
        </ResourceContext.Provider>
    );
};

const useResource = () => useContext(ResourceContext);

export { useResource, ResourceContextProvider };
