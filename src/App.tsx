import './App.css';
import ButtonGroup from './Components/ButtonGroup/ButtonGroup';
import ProfilePicture from "./Images/ProfilePicture.jpeg";
import Resume from './Components/Resume/Resume';
import Timeline from './Components/Timeline/Timeline';
import Projects from './Components/Projects/Projects';

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
      <Timeline />
      <Projects />
      <Resume />
    </div >
  );
}

export default App;
