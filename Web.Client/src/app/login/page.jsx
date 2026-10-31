import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSession } from '@/context/session';
import DarkModeToggle from '@/components/ui/DarkModeToggle';
import '@/styles/login.less';

export default function LoginPage() {
  const { login, isAuthenticated } = useSession();
  const navigate = useNavigate();
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('123456');
  const [error, setError] = useState(false);

  useEffect(() => {
    if (isAuthenticated) navigate('/dashboard', { replace: true });
  }, [isAuthenticated, navigate]);

  const submit = async (e) => {
    e.preventDefault();
    setError(false);
    const ok = await login(username, password).catch(() => false);
    if (ok) {
      navigate('/dashboard', { replace: true });
    } else {
      setError(true);
    }
  };

  return (
    <>
      <div className="bg-overlay"></div>
      <div className="login-section">
        <div className="login-title">
          <div className="logo">
            <img src="/images/racerui-logo-med.png" className="light" alt="RacerUI" />
            <img src="/images/racerui-logo-med-darkmode.png" className="dark" alt="RacerUI" />
          </div>
          <DarkModeToggle />
        </div>

        <div className="login-box">
          <form onSubmit={submit}>
            <div className="row hover">
              <div className="col field">Username</div>
              <div className="col input">
                <input type="text" name="username" value={username} onChange={(e) => setUsername(e.target.value)} />
              </div>
            </div>
            <div className="row hover">
              <div className="col field">Password</div>
              <div className="col input">
                <input type="password" name="password" value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>
            </div>
            {error && <div className="row"><div className="login-error">Invalid username or password</div></div>}
            <div className="row buttons">
              <button type="submit" className="login">
                <span className="tire-tracks">
                  <img src="/images/button-tire-track.png" alt="" />
                  <img src="/images/button-tire-track-blue.png" className="hover" alt="" />
                </span>
                Login
              </button>
            </div>
          </form>
        </div>

        <div className="login-footer">
          <p>Learn more about RacerUI at <a href="https://www.racerui.com" target="_blank" rel="noreferrer">RacerUI.com</a> or on <a href="https://github.com/markentingh/racerUI" target="_blank" rel="noreferrer">GitHub</a>.</p>
        </div>
      </div>
    </>
  );
}
