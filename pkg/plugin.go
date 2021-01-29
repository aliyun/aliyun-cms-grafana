package main

import (
	"net/http"
	"os"

	"github.com/grafana/grafana-plugin-sdk-go/backend"
	"github.com/grafana/grafana-plugin-sdk-go/backend/log"
	"github.com/grafana/grafana-plugin-sdk-go/backend/resource/httpadapter"
)

func main() {

	logger := log.New()

	mux := http.NewServeMux()

	ds := newDatasource()

	mux.HandleFunc("/proxy_aliyun_cms_pop", ds.ProxyCmsPopApi)
	mux.HandleFunc("/proxy_aliyun_ecs_pop", ds.ProxyEcsPopApi)
	mux.HandleFunc("/proxy_aliyun_rds_pop", ds.ProxyRdsPopApi)

	httpResourceHandler := httpadapter.New(mux)

	logger.Debug("Aliyun_CloudMonitor_Datasource")

	err := backend.Serve(backend.ServeOpts{
		CallResourceHandler: httpResourceHandler,
		// QueryDataHandler:    ds,
		CheckHealthHandler: ds,
	})

	if err != nil {
		logger.Error(err.Error())
		os.Exit(1)
	}
}
