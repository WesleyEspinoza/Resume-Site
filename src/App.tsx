import './App.css';
import ButtonGroup from './Components/ButtonGroup/ButtonGroup';
import ProfilePicture from "./Images/ProfilePicture.jpeg";

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <img src={ProfilePicture} alt='' />
        <p>
          E. Wesley Espinoza
        </p>
        <ButtonGroup />
        <div className='SocialIconGroup'>
          <a target="_blank" rel="noopener noreferrer" href="https://github.com/WesleyEspinoza">
            <button className='Github' />
          </a>
          <a target="_blank" rel="noopener noreferrer" href="https://www.linkedin.com/in/erick-espinoza/">
            <button className='Linkedin' />
          </a>
        </div>
      </header>
    </div >
  );
}

export default App;
