import { useEffect, useMemo } from "react";
import { map } from "../core/MapView";
import { createRoot } from "react-dom/client";
import "./mapControlLinks.css";
/**
 * Should follow the pattern to create a link on the map
 * { icon, href / onClick, title}
 */
class LinkControls{
    __link = null;
    constructor(link){
        this.setLink(link);
    }

    // Auto call methods
    onAdd(){
        return this.buildLink();
    }

    onRemove() {
        this.container.parentNode.removeChild(this.container);
    }

    // helpers
    getLink(){ return this.__link }
    setLink(link){ this.__link = link; return this; }
    buildLink(){
        // creating a button
        this.button = document.createElement( this.getLink().href ? 'a' : 'button');
        this.button.className = `maplibregl-ctrl-icon`;
        // rendering MUI icon to make it as SVG
        this.button.appendChild(this.renderReactIcon(this.getLink().icon));
        // connecting href / onClick interactions
        if(this.getLink()?.href) this.button.href = this.getLink().href;
        else if(this.getLink()?.onClick) this.button.onclick = this.getLink().onClick;

        this.container = document.createElement('div');
        this.container.className = 'maplibregl-ctrl-link maplibregl-ctrl-group maplibregl-ctrl maplibregl-control-bar-elm';
        this.container.appendChild(this.button);
        return this.container;
    }
    renderReactIcon(icon){
        const span = document.createElement('span');
        const root = createRoot(span);
        root.render(icon);

        return span;
    }
}

const MapControlLinks = ({links}) => {
    const controls = useMemo(() => {
        if(links.length > 0){
            return links.map(link => new LinkControls(link))
        }
        return [];
    }, [links]);

    useEffect(() => {
        controls.forEach(element => {
            map.addControl(element);
        });
        return () => controls.forEach(elm => map.removeControl(elm));
    }, [links]);

    return null;
}

export default MapControlLinks;