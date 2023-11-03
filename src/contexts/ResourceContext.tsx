import React, {
    createContext,
    useContext,
    useState,
    useRef,
    useEffect,
} from "react";
import Resource from "../lib/resource-utils";
import { supabase } from "../lib/api";
import { useAnnotation } from "./AnnotationContext";

type ResourceType = {
    types: Map<string, boolean>;
    generations: Map<string, boolean>;
};

type ResourceContextType = {
    resourceTypes: ResourceType;
    resources: React.MutableRefObject<Resource[]> | null;
    selectedResources: Resource[];
    handleSelectChange: (kind: string, name: string, checked: boolean) => void;
    addResource: (resource: Resource) => void;
    deleteResource: (id: string | undefined) => void;
};

const defaultResourceContext: ResourceContextType = {
    resourceTypes: {
        types: new Map<string, boolean>(),
        generations: new Map<string, boolean>(),
    },
    resources: null,
    selectedResources: [],
    handleSelectChange: (kind: string, name: string, checked: boolean) => {},
    addResource: (resource: Resource) => {},
    deleteResource: (id: string | undefined) => {},
};

const ResourceContext = createContext(defaultResourceContext);

const ResourceContextProvider = ({ children }: any) => {
    const resources = useRef<Resource[]>([]);
    const [resourceTypes, setResourceTypes] = useState<ResourceType>({
        types: new Map<string, boolean>(),
        generations: new Map<string, boolean>(),
    });
    const [selectedResources, setSelectedResources] = useState(
        resources.current
    );

    const { setError } = useAnnotation();

    useEffect(() => {
        console.log("useEffect on ResourceContext");
        fetchResources().catch(setError);
    }, []);

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
        const types = resources.current
            .map((r) => r.type)
            .filter((v, i, a) => a.indexOf(v) === i);
        const generations = resources.current
            .map((r) => r.generation)
            .filter((v, i, a) => a.indexOf(v) === i);

        setResourceTypes((prev) => {
            console.log("setResourceTypes", prev);
            const newResourceTypes = { ...resourceTypes };
            if (prev !== undefined) {
                // add types
                types.forEach((type) => {
                    if (prev.types.get(type) === undefined) {
                        newResourceTypes.types.set(type, true);
                    }
                });
                // remove types
                for (const type of prev.types.keys()) {
                    if (types.indexOf(type) === -1) {
                        newResourceTypes.types.delete(type);
                    }
                }

                // add generations
                generations.forEach((gen) => {
                    if (prev.generations.get(gen) === undefined) {
                        newResourceTypes.generations.set(gen, true);
                    }
                });
                // remove generations
                for (const gen of prev.generations.keys()) {
                    if (generations.indexOf(gen) === -1) {
                        newResourceTypes.generations.delete(gen);
                    }
                }
                return newResourceTypes;
            } else {
                return {
                    types: new Map(types.map((type) => [type, true])),
                    generations: new Map(generations.map((gen) => [gen, true])),
                };
            }
        });

        const newSelectedResources = resources.current.filter(
            (r) =>
                resourceTypes.types.get(r.type) &&
                resourceTypes.generations.get(r.generation)
        );
        setSelectedResources(newSelectedResources);
    };

    const fetchResources = async () => {
        let { data: res, error } = await supabase
            .from("resources")
            .select("*")
            .order("id", { ascending: false });
        if (error) setError(error.message);
        else {
            console.log("Resources: ", res);
            resources.current = res as Resource[];
            onUpdateResources();
        }
    };

    const addResource = async (r: Resource) => {
        console.log("addResource:", r);
        if (r.id) {
            let { data: resource, error } = await supabase
                .from("resources")
                .update({
                    id: r.id,
                    name: r.name,
                    type: r.type,
                    generation: r.generation,
                    display_color: r.display_color,
                    note: r.note,
                })
                .single();
            if (error) setError(error.message);
            else {
                console.log("Updated resources", resource);
                await fetchResources();
                setError(null);
            }
        } else {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            let { data, error } = await supabase
                .from("resources")
                .insert({
                    id: r.id,
                    name: r.name,
                    type: r.type,
                    generation: r.generation,
                    display_color: r.display_color,
                    note: r.note,
                })
                .single();
            if (error) setError(error.message);
            else {
                await fetchResources();
                setError(null);
            }
        }
    };

    const deleteResource = async (id: string | undefined) => {
        if (id) {
            let res = await supabase.from("resources").delete().eq("id", id);
            if (res.error !== null) {
                setError(res.error.details);
            } else {
                await fetchResources();
                setError(null);
            }
        }
    };

    const currentResourceContext: ResourceContextType = {
        resourceTypes: resourceTypes,
        resources: resources,
        selectedResources: selectedResources,
        handleSelectChange: handleSelectChange,
        addResource: addResource,
        deleteResource: deleteResource,
    };

    return (
        <ResourceContext.Provider value={currentResourceContext}>
            {children}
        </ResourceContext.Provider>
    );
};

const useResource = () => useContext(ResourceContext);

export { useResource, ResourceContextProvider };
