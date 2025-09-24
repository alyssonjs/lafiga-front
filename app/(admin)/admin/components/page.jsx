"use client";

import Button from "../../../_components/UI/Button";
import Card, {
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../../../_components/UI/Card";
import Input from "../../../_components/UI/Input";
import Badge from "../../../_components/UI/Badge";
import DatePicker from "../../../_components/UI/DatePicker";
import Dropdown from "../../../_components/UI/Dropdown";
import { Alert, AlertTitle, AlertDescription } from "../../../_components/UI/Alert";
import Carousel from "../../../_components/UI/Carousel"
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../../_components/UI/Dialog";

import Select from "../../../_components/UI/Select";
import Divider from "../../../_components/UI/Divider";
import Drawer from "../../../_components/UI/Drawer";

const ComponentsPage = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(null);
  const [drawerOverlayOpen, setDrawerOverlayOpen] = useState(false);
  const [drawerOverlayRightOpen, setDrawerOverlayRightOpen] = useState(false);
  const [drawerPushOpen, setDrawerPushOpen] = useState(false);
  const [drawerPushLeftOpen, setDrawerPushLeftOpen] = useState(false);

  let options = [
    { id: 1, name: "Australia" },
    { id: 2, name: "Brazil" },
    { id: 3, name: "China" },
    { id: 4, name: "Denmark" },
    { id: 5, name: "Egypt" },
    { id: 6, name: "Finland" },
    { id: 7, name: "Ghana" },
    { id: 8, name: "Hungary" },
    { id: 9, name: "India" },
    { id: 10, name: "Japan" },
  ];

  const demoSlides = [
    {
      id: 1,
      title: 'Slide 1 - Exemplo Simples',
      image: '/images/slide1.jpg',
      description: 'Este é um slide básico com apenas uma imagem e título'
    },
    {
      id: 2,
      title: 'Slide 2 - Conteúdo Detalhado',
      image: '/images/slide2.jpg',
      description: 'Aqui temos mais informações que podem ser exibidas',
      ctaText: 'Saiba mais',
      ctaLink: '/detalhes'
    },
    {
      id: 3,
      title: 'Slide 3 - Destaque Especial',
      image: '/images/slide3.jpg',
      description: 'Slide com conteúdo em destaque e chamada para ação',
      isFeatured: true
    }
  ];

  const handleSlideChange = (slide) => {
    setCurrentSlide(slide);
  };


  return (
    <>
      <div>
        <div style={{ display: "flex", gap: "1em", padding: "20px", flexWrap: "wrap" }}>
          <Button size="lg">{`size="lg"`}</Button>
          <Button size="md">{`size="md"`}</Button>
          <Button size="sm">{`size="sm"`}</Button>
          <Button size="icon">{`i`}</Button>
        </div>
        <div style={{ display: "flex", gap: "1em", padding: "20px", flexWrap: "wrap" }}>
          <Button variant="primary" size="md">Voltar</Button>
          <Button variant="secondary" size="md">Ver Mais</Button>
          <Button variant="accent" size="md">Confirmar</Button>
        </div>
        <div style={{ display: "flex", gap: "1em", padding: "20px", flexWrap: "wrap" }}>
          <Button variant="highlight" size="sm">Cancelar</Button>
          <Button variant="medium" size="sm">Desfazer</Button>
          <Button variant="helper" size="md">Ajuda</Button>
        </div>
        <div style={{ display: "flex", gap: "1em", padding: "20px", flexWrap: "wrap" }}>
          <Input type="email" placeholder="Default" />
          <Input disabled type="email" placeholder="Disabled" />
        </div>
        <div style={{ display: "flex", gap: "1em", padding: "20px", flexWrap: "wrap" }}>
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
              <Button variant="highlight">Cancel</Button>
              <Button variant="accent">Ok</Button>
            </CardFooter>
          </Card>

          <Card style={{ width: "350px" }}>
            <CardHeader>
              <CardTitle>Title</CardTitle>
              <CardDescription>Description</CardDescription>
              <Badge variant="secondary">Status</Badge>
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

        <div style={{ display: "flex", gap: "1em", padding: "20px", flexWrap: "wrap" }}>
          <Divider color="yellow" />   
          <Divider color="red" /> 
          <Divider />                   
        </div>

        <div style={{ display: "flex", gap: "1em", padding: "20px", flexWrap: "wrap" }}>
          <Select
            placeholder="MultipleSelect"
            options={options}
            multiselect
          />
        </div>
        
        <div style={{ display: "flex", gap: "1em", padding: "20px", flexWrap: "wrap" }}>
          <DatePicker />
        </div>

        <div style={{ display: "flex", gap: "1em", padding: "20px", flexWrap: "wrap" }}>
          <Select placeholder="Select" options={options} />
        </div>

        <div style={{ display: "flex", gap: "1em", padding: "20px", flexWrap: "wrap" }}>
          <Badge>Badge</Badge>
          <Badge variant="primary">Primary</Badge>
          <Badge variant="secondary">Secondary</Badge>
          <Badge variant="highlight">Highlight</Badge>
          <Badge variant="medium">Medium</Badge>
          <Badge variant="accent">Accent</Badge>
          <Badge variant="dark">Dark</Badge>
          <Badge>Um teste com um texto grande</Badge>
        </div>      

        <div style={{ display: "flex", gap: "1em", padding: "20px", justifyContent: "space-between" }}>
          <div style={{display: "flex"}}>
              <div style={{display: "flex", flexDirection: "column"}}>
                <h3>Padrão</h3>
                <Alert variant="default">
                  <AlertTitle>Alerta Padrão</AlertTitle>
                  <AlertDescription>
                    Este é um alerta com estilo padrão usando cores primárias.
                  </AlertDescription>
                </Alert>
              </div>
              <div style={{display: "flex", flexDirection: "column", marginLeft: "16px"}}>
                <h3>Destrutivo</h3>
                <Alert variant="destructive">
                  <AlertTitle>Ação Destrutiva</AlertTitle>
                  <AlertDescription>
                    Esta ação não pode ser desfeita. Proceda com cautela.
                  </AlertDescription>
                </Alert>
              </div>
          </div>
        </div> 

        <div style={{display: "flex", gap: "1em", padding: "20px"}}>
          <Dropdown
            trigger={
              <>
                {openDropdown ? (
                  <Button variant="secondary" status="pressed" onClick={() => setOpenDropdown(false)}>
                    Dropdown
                  </Button>
                ) : (
                  <Button variant="secondary" onClick={() => setOpenDropdown(true)}>
                    Dropdown
                  </Button>
                )}
                
              </>
            }

            onOutsideClick={() => setOpenDropdown(false)}
            contentWidth="170px"
          >
            <div style={{padding: "8px 16px"}}>
              <div style={{color: 'white'}}>
                TEXTO PADRÃO 1
              </div>
              <div style={{color: 'white'}}>
                TEXTO PADRÃO 2
              </div>
              <div style={{color: 'white'}}>
                TEXTO PADRÃO 3
              </div>
              <div style={{color: 'white'}}>
                TEXTO PADRÃO 4
              </div>
            </div>
          </Dropdown>

          <div style={{ display: "flex", gap: "1em", padding: "20px", flexWrap: "wrap" }}>
            <Button onClick={() => setIsOpen(true)}>Show Dialog Modal</Button>
            {isOpen && (
              <Dialog onClose={() => setIsOpen(false)}>
                <DialogHeader>
                  <DialogTitle>Title</DialogTitle>
                  <DialogDescription>Description</DialogDescription>
                </DialogHeader>
                <DialogContent>
                  <div
                    style={{ display: "flex", flexDirection: "column", gap: "1em" }}
                  >
                    <Input type="email" placeholder="Input" />
                    <Input type="email" placeholder="Input 2" />
                  </div>
                </DialogContent>
                <DialogFooter>
                  <Button variant="accent" onClick={() => setIsOpen(false)}>
                    Close Dialog Modal
                  </Button>
                </DialogFooter>
              </Dialog>
            )}
          </div>
        </div>

        <div style={{ display: "flex", gap: "1em", padding: "20px", flexWrap: "wrap" }}>
          <Button onClick={() => setDrawerOverlayOpen(true)}>
            Abrir Drawer Overlay Left
          </Button>
          <Button onClick={() => setDrawerOverlayRightOpen(true)}>
            Abrir Drawer Overlay Right
          </Button>
          <Button onClick={() => setDrawerPushLeftOpen(true)}>
            Abrir Drawer Push Left
          </Button>
          <Button onClick={() => setDrawerPushOpen(true)}>
            Abrir Drawer Push Right
          </Button>
        </div>
        <Drawer
          open={drawerOverlayOpen}
          onClose={() => setDrawerOverlayOpen(false)}
          type="overlay"
          side="left"
          width="320px"
        >
          <div style={{ padding: "24px" }}>
            <h3>Drawer Overlay Left</h3>
            <p>Esse drawer aparece por cima dessa mizera aqui(lado esquerdo).</p>
            <Button onClick={() => setDrawerOverlayOpen(false)}>Fechar</Button>
          </div>
        </Drawer>
        <Drawer
          open={drawerOverlayRightOpen}
          onClose={() => setDrawerOverlayRightOpen(false)}
          type="overlay"
          side="right"
          width="320px"
        >
          <div style={{ padding: "24px" }}>
            <h3>Drawer Overlay Right</h3>
            <p>E esse Drawer aparece por cima do conteúdo dessa peste (lado direito).</p>
            <Button onClick={() => setDrawerOverlayRightOpen(false)}>Fechar</Button>
          </div>
        </Drawer>
      </div>

      <div style={{ overflowX: "hidden", position: "relative" }}>
        <div
          id="push-demo-container"
          style={{
            position: "relative",
            background: "#f7f7f7",
            minHeight: "200px",
            padding: "32px",
            transition: "margin 0.3s cubic-bezier(.4,0,.2,1)",
            marginLeft: drawerPushLeftOpen ? "var(--drawer-width)" : undefined,
            marginRight: drawerPushOpen ? "var(--drawer-width)" : undefined,
          }}
        >
          <h2>Conteúdo do Container</h2>
          <p>Este container serve para demonstrar o Drawer dos dois lados.</p>
          <p>E pipipi popopo! E agora um lorem ipsum</p>
          <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod 
            tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, 
            quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo 
            consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse 
            cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat 
            non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</p>
        </div>
        <Drawer
          open={drawerPushLeftOpen}
          onClose={() => setDrawerPushLeftOpen(false)}
          type="push"
          side="left"
          width="var(--drawer-width)"
        >
          <div style={{ padding: "24px" }}>
            <h3>Drawer Left</h3>
            <p>Este Drawer empurra o conteúdo da página (lado esquerdo).</p>
            <Button onClick={() => setDrawerPushLeftOpen(false)}>Fechar</Button>
          </div>
        </Drawer>
        <Drawer
          open={drawerPushOpen}
          onClose={() => setDrawerPushOpen(false)}
          type="push"
          side="right"
          width="var(--drawer-width)"
        >
          <div style={{ padding: "24px" }}>
            <h3>Drawer Right</h3>
            <p>Este Drawer empurra o conteúdo da página (lado direito).</p>
            <Button onClick={() => setDrawerPushOpen(false)}>Fechar</Button>
          </div>
        </Drawer>
      </div>
    </>
  );
};

export default ComponentsPage;
