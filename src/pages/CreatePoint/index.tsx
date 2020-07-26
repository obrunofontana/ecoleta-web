import React, { useEffect, useState, ChangeEvent, FormEvent } from 'react';
import { Link, useHistory } from 'react-router-dom';
import { FiArrowLeft } from 'react-icons/fi' ;
import { Map, TileLayer, Marker } from 'react-leaflet';
import axios from 'axios';
import api from '../../services/api';
import { LeafletMouseEvent } from 'leaflet';

import './styles.css';
import logo from '../../assets/logo.svg';

// Sempre que criamos um estado para um ARRAY ou OBJETO, precisamos informar manualmente o tipo da variavel que sera
// armazenada ali dentro;
interface ItemCollect {
  id: number;
  title: string;
  imageUrl: string;
}

interface IBGEUFResponse {
  sigla: string
}

interface IBGECityResponse {
  nome: string
}

const CreatePoint: React.FC = () => {
  const [items, setItems] = useState<ItemCollect[]>([]);
  const [ufs, setUfs] = useState<string[]>([]);

  // Posicao do usuario no mapa
  const [initialPosition, setInitialPosition ] = useState<[number, number]>([0,0]);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    whatsapp: ''
  });

  const [selectedItems, setSelectedItems] = useState<number[]>([]);

  const [cities, setCities] = useState<string[]>([]);
  const [selectedUf, setSelectedUf] = useState<string>('0');
  const [selectedCity, setSelectedCity] = useState<string>('0');
  const [selectedPosition, setSelectedPosition ] = useState<[number, number]>([0,0]);

  useEffect(() => {
    // Seta a posicao do usuario logado
    navigator.geolocation.getCurrentPosition((position) => {
      const { latitude, longitude } = position.coords;
      setInitialPosition([latitude, longitude]);
    });
  });

  const history = useHistory();

  // Use effect praticamente é uma computada do ember; (framework that I work);
  // Se passar o segundo parametro vazio, é disparado somente uma vez quando component for exibido em tela;
  // Obs: Não é possivel utilizar o async/await no useEffect, bloquei do próprio ReactJS
  useEffect(() => {
    api.get('itemscollect')
      .then((response) => {
        setItems( response.data);
      })
      .catch((e) => {        
        console.log('Error :: CreatPoint :: useEffect :: itemsCollect', e);
      });

  }, []);

  useEffect(() => {
    axios.get<IBGEUFResponse[]>('https://servicodados.ibge.gov.br/api/v1/localidades/estados')
      .then((response) => {
        const ufInitials = response.data.map((uf) => uf.sigla);
        setUfs(ufInitials);
      })
      .catch((e) => {        
        console.log('Error :: CreatPoint :: useEffect :: uf', e);
      });

  }, []);

  useEffect(() => {
    if (selectedUf === '0') { return; }
    axios.get<IBGECityResponse[]>(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${selectedUf}/municipios`)
      .then((response) => {
        const cityNames = response.data.map((city) => city.nome);
        setCities(cityNames);
      })
      .catch((e) => {        
        console.log('Error :: CreatPoint :: useEffect :: uf', e);
      });
  }, [selectedUf]);

  function handleSelectUf(event: ChangeEvent<HTMLSelectElement>) {
    setSelectedUf(event.target.value);
  }
  
  function handleSelectCity(event: ChangeEvent<HTMLSelectElement>) {
    setSelectedCity(event.target.value);
  }
  
  function handleMapClick(event: LeafletMouseEvent) {
    setSelectedPosition([event.latlng.lat, event.latlng.lng]);
  }

  function handleInputChange(event: ChangeEvent<HTMLInputElement>) {
    const { name, value } = event.target;
    setFormData({ ...formData, [name]: value});
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const { name, email, whatsapp } = formData;
    const uf = selectedUf;
    const city = selectedCity;
    const items = selectedItems;
    const [latitude, longitude] = selectedPosition;

    const data = { name, email, whatsapp, uf, city, items, latitude, longitude }

    await api.post('collectPoints', data);

    alert('Ponto de coleta criado');

    history.push('/');
  }

  function handleSelectItem(id: number) {
    const alreadySelected = selectedItems.findIndex((item) => item === id);

    if (alreadySelected >= 0) {
      const filteredItems = selectedItems.filter((item) => item !== id);
      setSelectedItems(filteredItems);
    } else {
      setSelectedItems([...selectedItems, id]);
    }
  }

  return (
    <div id="page-create-point">
      <header>
        <img src={logo} alt="Ecoleta"/>

        <Link to="/">
          <FiArrowLeft /> 
          Voltar para home
        </Link> 
      </header>

      <form onSubmit={handleSubmit}>
        <h1>Cadastro de Coletador</h1>

        {/* Dados */}
        <fieldset>
          <legend>
            <h2>Dados</h2>
          </legend>

          <div className="field">
            <label htmlFor="name">Nome da Entidade</label>
            <input type="text" id="name" name="name" onChange={handleInputChange}></input>
          </div>
          
          <div className="field-group">
            <div className="field">
              <label htmlFor="email">E-mail</label>
              <input id="email" type="email" name="email" onChange={handleInputChange}></input>
            </div>

            <div className="field">
              <label htmlFor="whatsapp">Whatsapp</label>
              <input id="whatsapp" type="text" name="whatsapp" onChange={handleInputChange}></input>
            </div>
          </div>
        </fieldset>
        
        {/* Endereço */}
        <fieldset>
          <legend>
            <h2>Endereço</h2>
            <span>Selecione o endereço no mapa</span>
          </legend>

          {/* Mapa de código aberto */}
          <Map center={initialPosition} zoom={15} onClick={handleMapClick}>
            <TileLayer
              attribution='&amp;copy <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            <Marker  position={selectedPosition}/>
          </Map>

          <div className="field-group">
            <div className="field">
              <label htmlFor="uf">Estado (UF)</label>
              <select 
                id="uf" 
                name="uf" 
                value={selectedUf} 
                onChange={handleSelectUf}              
              >
                <option value="0">Selecione uma UF</option>
                {ufs.map((uf) => {
                  return (
                    <option key={uf} value={uf}>{uf}</option>
                  )
                })}
              </select>
            </div>

            <div className="field">
              <label htmlFor="city">Cidade</label>
              <select 
                id="city"
                name="city" 
                value={selectedCity} 
                onChange={handleSelectCity}
              >
                <option value="0">Selecione uma cidade</option>
                {cities.map((city) => {
                  return (
                    <option key={city} value={city}>{city}</option>                    
                  )
                })}
              </select>
            </div>
          </div>
        </fieldset>

        {/* Itens para coleta */}
        <fieldset>
          <legend>
            <h2>Itens de Coleta</h2> 
            <span>Selecione um ou mais itens abaixo</span>
          </legend>

          <ul className="items-grid">
            {items.map((item) => {
              return (
                <li 
                  key={item.id} 
                  onClick={() => handleSelectItem(item.id)}
                  className={selectedItems.includes(item.id) ? 'selected': ''}
                >
                  <img src={item.imageUrl} alt={item.title} />
                  <span>{item.title}</span>
                </li>
              )
            })}
          </ul>
        </fieldset>

        <button type="submit">Cadastrar ponto de coleta</button>
      </form>
    </div>
  )
}

export default CreatePoint;
