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

const ComponentsPage = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(null);

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
      <div style={{ display: "flex", gap: "1em", padding: "20px" }}>
        <Button size="lg">{`size="lg"`}</Button>
        <Button size="md">{`size="md"`}</Button>
        <Button size="sm">{`size="sm"`}</Button>
        <Button size="icon">{`i`}</Button>
      </div>
      <div style={{ display: "flex", gap: "1em", padding: "20px" }}>
        <Button variant="primary" size="md">Voltar</Button>
        <Button variant="secondary" size="md">Ver Mais</Button>
        <Button variant="accent" size="md">Confirmar</Button>
      </div>
      <div style={{ display: "flex", gap: "1em", padding: "20px" }}>
        <Button variant="highlight" size="sm">Cancelar</Button>
        <Button variant="medium" size="sm">Desfazer</Button>
        <Button variant="helper" size="md">Ajuda</Button>
      </div>
      <div style={{ display: "flex", gap: "1em", padding: "20px" }}>
        <Input type="email" placeholder="Default" />
        <Input disabled type="email" placeholder="Disabled" />
      </div>
      <div style={{ display: "flex", gap: "1em", padding: "20px" }}>
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

      <div style={{ display: "flex", gap: "1em", padding: "20px" }}>
        <Select
          placeholder="MultipleSelect"
          options={options}
          multiselect
        />
      </div>

      <div style={{ display: "flex", gap: "1em", padding: "20px" }}>
        <Select placeholder="Select" options={options} />
      </div>

      <div style={{ display: "flex", gap: "1em", padding: "20px" }}>
        <DatePicker />
      </div>

      <div style={{ display: "flex", gap: "1em", padding: "20px" }}>
        <Badge>Badge</Badge>
        <Badge variant="secondary">Secondary</Badge>
        <Badge variant="outline">Outline</Badge>
        <Badge variant="accent">Accent</Badge>
      </div>      

      <div style={{ display: "flex", gap: "1em", padding: "20px", justifyContent: "space-between"}}>
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

            {/* Alert Destrutivo */}
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

        <div style={{display: "flex", justifyContent: "flex-end", flexDirection: "column"}}>
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

          <div style={{ display: "flex", gap: "1em", padding: "20px" }}>
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
      </div> 
    </>
  );
};

export default ComponentsPage;
